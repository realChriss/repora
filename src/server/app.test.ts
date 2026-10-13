import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { clearCache } from "../shared/cache";
import { app } from "./index";
import { renderError } from "../shared/render";
import { LAYOUTS, STYLE_NAMES } from "../shared/card-options";
import { cardQuery } from "../shared/options";
import { FONT_NAMES, FONT_WEIGHTS, fontFile, type Embed } from "../shared/render/fonts";
import { renderRepoCard } from "../shared/repo-card";
import { noServerCode } from "./builder";

const realFetch = globalThis.fetch;

function mockGitHub(status = 200, repo: Record<string, unknown> = {}) {
  const fetchMock = mock(async (url: string | URL | Request, _init?: RequestInit) => {
    if (String(url).startsWith("https://raw.githubusercontent.com/")) {
      return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { "content-type": "image/png" } });
    }
    if (status !== 200) return new Response("{}", { status });
    return Response.json({
      name: "hono",
      owner: { login: "honojs" },
      description: "Web framework <built> on Web Standards",
      language: "TypeScript",
      stargazers_count: 21000,
      forks_count: 600,
      default_branch: "main",
      ...repo,
    });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => clearCache());
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("renders every style and layout", async () => {
  mockGitHub();
  for (const style of STYLE_NAMES) {
    for (const layout of ["card", "pill"]) {
      const res = await app.request(`/honojs/hono?style=${style}&layout=${layout}`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("image/svg+xml");
      expect(res.headers.get("cache-control")).toContain("max-age=1800");
      const body = await res.text();
      expect(body).toStartWith("<svg");
      expect(body).toContain("hono");
    }
  }
});

test("escapes repo text and applies display toggles", async () => {
  mockGitHub();
  const body = await (await app.request("/honojs/hono?show_stars=false&show_forks=0")).text();
  expect(body).toContain("&lt;built&gt;");
  expect(body).not.toContain("21k");
  expect(body).not.toContain("forks");
});

test("embeds an icon from the linked repo", async () => {
  const fetchMock = mockGitHub();
  const body = await (await app.request("/honojs/hono?icon=docs/logo.png")).text();
  expect(body).toContain("data:image/png;base64,");
  expect(String(fetchMock.mock.calls.at(-1)?.[0])).toBe(
    "https://raw.githubusercontent.com/honojs/hono/main/docs/logo.png",
  );
});

test("scales the image size but not the layout", async () => {
  mockGitHub();
  const size = async (query: string) =>
    (await (await app.request(`/honojs/hono${query}`)).text()).match(/width="(\d+)" height="(\d+)" (viewBox="[^"]+")/)!;
  const [, width, height, viewBox] = await size("");
  expect(viewBox).toBe(`viewBox="0 0 ${width} ${height}"`);
  expect((await size("?scale=2")).slice(1)).toEqual([`${Number(width) * 2}`, `${Number(height) * 2}`, viewBox!]);
});

test("shows an error card for a missing repo", async () => {
  mockGitHub(404);
  const res = await app.request("/honojs/nope");
  expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  expect(await res.text()).toContain("Repository not found");
});

test("skips the API for repos whose page is missing", async () => {
  const fetchMock = mockGitHub(404);
  expect(await (await app.request("/honojs/nope")).text()).toContain("Repository not found");
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(["https://github.com/honojs/nope"]);
});

test("rejects invalid options before calling GitHub", async () => {
  const fetchMock = mockGitHub();
  for (const query of ["accent=red", "icon=../secret.png", "icon=https://evil.example/x.png", "style=nope", "scale=5"]) {
    const res = await app.request(`/honojs/hono?${query}`);
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  }
  expect(fetchMock).not.toHaveBeenCalled();
});

test("reports GitHub rate limiting", async () => {
  mockGitHub(403);
  expect(await (await app.request("/honojs/hono")).text()).toContain("GitHub rate limit reached");
});

test("reports GitHub timeouts", async () => {
  globalThis.fetch = (async () => {
    throw new DOMException("timed out", "TimeoutError");
  }) as unknown as typeof fetch;
  expect(await (await app.request("/honojs/hono")).text()).toContain("GitHub is not responding");
});

test("renders repos without description or language", async () => {
  mockGitHub(200, {
    name: "empty",
    owner: { login: "someone" },
    description: null,
    language: null,
    stargazers_count: 0,
    forks_count: 0,
  });
  const body = await (await app.request("/someone/empty?style=tinted")).text();
  expect(body).toContain("someone/empty");
  expect(body).toContain("0 forks");
});

test("falls back to the monogram when a streamed icon exceeds the cap", async () => {
  mockGitHub();
  const apiFetch = globalThis.fetch;
  const chunk = new Uint8Array(600 * 1024);
  globalThis.fetch = (async (url: string) =>
    String(url).startsWith("https://raw.githubusercontent.com/")
      ? new Response(new Blob([chunk, chunk]).stream())
      : apiFetch(url)) as unknown as typeof fetch;
  const body = await (await app.request("/honojs/hono?icon=big.png")).text();
  expect(body).not.toContain("data:image/png");
  expect(body).toContain(">H</text>");
});

test("serves the builder page and its assets", async () => {
  const page = await (await app.request("/")).text();
  expect(page).toContain('<div id="app"');
  expect(page).toContain("<h1>Repo cards for your README</h1>");

  const script = await app.request("/assets/builder.js");
  expect(script.headers.get("content-type")).toContain("javascript");
  const js = await script.text();
  expect(js.includes("preview-image")).toBe(true);
  expect(js.includes("harfbuzz")).toBe(false);

  const css = await app.request("/assets/builder.css");
  expect(css.headers.get("content-type")).toContain("text/css");
  const stylesheet = await css.text();
  expect(stylesheet).not.toContain("\n  ");
  expect(stylesheet).toContain("url(/assets/fonts/plex-400.woff2)");

  for (const name of FONT_NAMES) {
    for (const weight of FONT_WEIGHTS) {
      const font = await app.request(`/assets/fonts/${fontFile(name, weight)}`);
      expect(font.headers.get("content-type")).toBe("font/woff2");
      expect((await font.arrayBuffer()).byteLength).toBeGreaterThan(1000);
    }
  }

  expect((await app.request("/assets/fonts/../../package.json")).status).toBe(404);
  expect((await app.request("/assets/fonts/constructor")).status).toBe(404);
});

test("wraps long error messages inside the card", () => {
  expect(renderError("word ".repeat(40)).match(/<tspan/g)?.length).toBeGreaterThan(1);
});

test("embeds only a subset of the font", async () => {
  mockGitHub();
  for (const style of STYLE_NAMES) {
    const body = await (await app.request(`/honojs/hono?style=${style}`)).text();
    expect(body).toContain("@font-face");
    expect(body.length).toBeLessThan(15_000);
  }
});

test("scopes svg ids per card so inlined cards do not collide", async () => {
  mockGitHub();
  const a = await (await app.request("/honojs/hono?style=glow")).text();
  const b = await (await app.request("/honojs/hono?style=glow&accent=FF8A5B")).text();
  const ids = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]!);
  expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);
  const refs = [...a.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]!);
  expect(refs.length).toBeGreaterThan(0);
  for (const ref of refs) expect(ids(a)).toContain(ref);
});

test("right-aligns right-to-left descriptions", async () => {
  mockGitHub(200, { description: "שלום עולם" });
  const body = await (await app.request("/honojs/hono")).text();
  expect(body).toContain('text-anchor="end"');
});

const fullFont: Embed = async (name, weight) =>
  (await (await app.request(`/assets/fonts/${fontFile(name, weight)}`)).bytes()).toBase64();

test("the builder's full-font render matches the served card apart from the font data", async () => {
  mockGitHub();
  const stripFonts = (svg: string) => svg.replace(/base64,[^)]+/g, "");
  const variants = ["icon=logo.png", "bg=101820&fg=FEE715&muted=9a9a9a&accent=F00&width=620&scale=1.5&show_forks=false"];
  for (const style of STYLE_NAMES) {
    for (const layout of LAYOUTS) {
      for (const variant of variants) {
        const params = new URLSearchParams(`style=${style}&layout=${layout}&${variant}`);
        const served = await (await app.request(`/honojs/hono?${params}`)).text();
        const query = cardQuery.parse(Object.fromEntries(params));
        const client = await renderRepoCard("honojs", "hono", query, { embed: fullFont });
        expect(stripFonts(client)).toBe(stripFonts(served));
      }
    }
  }
});

test("only the server checks the repo page and sends its token", async () => {
  const fetchMock = mockGitHub();
  const calls = () => fetchMock.mock.calls.map(([url, init]) => [String(url), new Headers(init?.headers).get("authorization")]);
  const token = Bun.env.GITHUB_TOKEN;
  Bun.env.GITHUB_TOKEN = "secret";
  try {
    await app.request("/honojs/hono");
  } finally {
    if (token === undefined) delete Bun.env.GITHUB_TOKEN;
    else Bun.env.GITHUB_TOKEN = token;
  }
  expect(calls()).toEqual([
    ["https://github.com/honojs/hono", null],
    ["https://api.github.com/repos/honojs/hono", "Bearer secret"],
  ]);

  clearCache();
  fetchMock.mockClear();
  await renderRepoCard("honojs", "hono", cardQuery.parse({}), { embed: fullFont });
  expect(calls().filter(([url]) => !url!.startsWith("http://localhost/"))).toEqual([
    ["https://api.github.com/repos/honojs/hono", null],
  ]);
});

test("the browser bundle refuses server-only files", async () => {
  const entry = Bun.fileURLToPath(new URL("./log.ts", import.meta.url));
  const built = await Bun.build({ entrypoints: [entry], target: "browser", plugins: [noServerCode] }).then(
    (result) => result.success,
    () => false,
  );
  expect(built).toBe(false);
});
