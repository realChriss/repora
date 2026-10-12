import { Hono } from "hono";
import { fontsourceFile } from "../render/fonts";
import { builderPage } from "./page";

const IMMUTABLE = "public, max-age=31536000, immutable";

const PAGE_FONTS: Record<string, string> = {
  "plex-sans-400.woff2": fontsourceFile("ibm-plex-sans", 400),
  "plex-sans-600.woff2": fontsourceFile("ibm-plex-sans", 600),
  "fira-code-400.woff2": fontsourceFile("fira-code", 400),
};

interface Assets {
  js: string;
  css: string;
  /** Appended as ?v= to asset URLs; required because the assets are served as immutable. */
  version: string;
}

let assets: Promise<Assets> | undefined;

function loadAssets(): Promise<Assets> {
  assets ??= (async () => {
    const result = await Bun.build({
      entrypoints: [Bun.fileURLToPath(new URL("./client.ts", import.meta.url))],
      target: "browser",
      minify: true,
    });
    if (!result.success || !result.outputs[0]) throw new AggregateError(result.logs, "Builder script failed to bundle");
    const js = await result.outputs[0].text();
    const css = await Bun.file(new URL("./styles.css", import.meta.url)).text();
    return { js, css, version: Bun.hash(js + css).toString(36) };
  })();
  return assets;
}

export const builder = new Hono();

builder.get("/", async (c) => c.html(builderPage((await loadAssets()).version)));

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

builder.get("/assets/fonts/:file", (c) => {
  const file = c.req.param("file");
  if (!Object.hasOwn(PAGE_FONTS, file)) return c.notFound();
  const path = PAGE_FONTS[file]!;
  c.header("Content-Type", "font/woff2");
  c.header("Cache-Control", IMMUTABLE);
  return c.body(Bun.file(path).stream());
});
