import { Hono, type Context } from "hono";
import { FONT_NAMES, FONT_WEIGHTS, fontFile } from "../shared/render/fonts";
import { fontsourceFile } from "./fonts";
import { builderPage } from "./page";

const IMMUTABLE = "public, max-age=31536000, immutable";

const FONT_FILES = Object.fromEntries(
  FONT_NAMES.flatMap((name) => FONT_WEIGHTS.map((weight) => [fontFile(name, weight), fontsourceFile(name, weight)])),
);

interface Assets {
  js: string;
  css: string;
  /** Appended as ?v= to asset URLs; required because the assets are served as immutable. */
  version: string;
}

const SERVER_DIR = Bun.fileURLToPath(new URL(".", import.meta.url));

export const noServerCode: Bun.BunPlugin = {
  name: "no-server-code",
  setup(build) {
    build.onLoad({ filter: new RegExp(`^${RegExp.escape(SERVER_DIR)}`) }, ({ path }) => {
      throw new Error(`${path} is server-only and must not be bundled for the browser`);
    });
  },
};

let assets: Promise<Assets> | undefined;

function loadAssets(): Promise<Assets> {
  assets ??= (async () => {
    const result = await Bun.build({
      entrypoints: [Bun.fileURLToPath(new URL("../client/builder.ts", import.meta.url))],
      target: "browser",
      minify: true,
      plugins: [noServerCode],
    });
    if (!result.success || !result.outputs[0]) throw new AggregateError(result.logs, "Builder script failed to bundle");
    const js = await result.outputs[0].text();
    const css = await Bun.file(new URL("../client/styles.css", import.meta.url)).text();
    return { js, css, version: Bun.hash(js + css).toString(36) };
  })();
  return assets;
}

export const builder = new Hono();

// Built from the request so self-hosted instances link to themselves; proxies like Cloudflare pass the scheme in x-forwarded-proto.
function publicOrigin(c: Context) {
  const url = new URL(c.req.url);
  return `${c.req.header("x-forwarded-proto") ?? url.protocol.slice(0, -1)}://${url.host}`;
}

builder.get("/", async (c) => c.html(builderPage((await loadAssets()).version, publicOrigin(c))));

builder.get("/assets/builder.js", async (c) => {
  c.header("Content-Type", "text/javascript; charset=utf-8");
  c.header("Cache-Control", IMMUTABLE);
  return c.body((await loadAssets()).js);
});

builder.get("/assets/builder.css", async (c) => {
  c.header("Content-Type", "text/css; charset=utf-8");
  c.header("Cache-Control", IMMUTABLE);
  return c.body((await loadAssets()).css);
});

builder.get("/favicon.svg", (c) => {
  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", "public, max-age=86400");
  return c.body(Bun.file(new URL("../client/favicon.svg", import.meta.url)).stream());
});

builder.get("/icon.png", (c) => {
  c.header("Content-Type", "image/png");
  c.header("Cache-Control", "public, max-age=86400");
  return c.body(Bun.file(new URL("../../assets/icon.png", import.meta.url)).stream());
});

builder.get("/assets/fonts/:file", (c) => {
  const file = c.req.param("file");
  if (!Object.hasOwn(FONT_FILES, file)) return c.notFound();
  const path = FONT_FILES[file]!;
  c.header("Content-Type", "font/woff2");
  c.header("Cache-Control", IMMUTABLE);
  return c.body(Bun.file(path).stream());
});
