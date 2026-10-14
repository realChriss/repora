import { afterEach, beforeEach, expect, mock, setSystemTime, spyOn, test } from "bun:test";
import { clearCache } from "../shared/cache";
import { app, missStore } from "./index";
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
      name: "repora",
      owner: { login: "realChriss" },
      description: "SVG cards <for> a GitHub repository",
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

beforeEach(() => {
  clearCache();
  missStore.resetAll();
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("renders every style and layout", async () => {
  mockGitHub();
  for (const style of STYLE_NAMES) {
    for (const layout of ["card", "pill"]) {
      const res = await app.request(`/realChriss/repora?style=${style}&layout=${layout}`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("image/svg+xml");
      expect(res.headers.get("cache-control")).toContain("max-age=1800");
      const body = await res.text();
      expect(body).toStartWith("<svg");
      expect(body).toContain("repora");
    }
  }
});

test("escapes repo text and applies display toggles", async () => {
  mockGitHub();
  const body = await (await app.request("/realChriss/repora?show_stars=false&show_forks=0")).text();
  expect(body).toContain("&lt;for&gt;");
  expect(body).not.toContain("21k");
  expect(body).not.toContain("forks");
});

test("embeds an icon from the linked repo", async () => {
  const fetchMock = mockGitHub();
  const body = await (await app.request("/realChriss/repora?icon=docs/logo.png")).text();
  expect(body).toContain("data:image/png;base64,");
  expect(String(fetchMock.mock.calls.at(-1)?.[0])).toBe(
    "https://raw.githubusercontent.com/realChriss/repora/main/docs/logo.png",
  );
});

test("scales the image size but not the layout", async () => {
  mockGitHub();
  const size = async (query: string) =>
    (await (await app.request(`/realChriss/repora${query}`)).text()).match(/width="(\d+)" height="(\d+)" (viewBox="[^"]+")/)!;
  const [, width, height, viewBox] = await size("");
  expect(viewBox).toBe(`viewBox="0 0 ${width} ${height}"`);
  expect((await size("?scale=2")).slice(1)).toEqual([`${Number(width) * 2}`, `${Number(height) * 2}`, viewBox!]);
});

test("shows an error card for a missing repo", async () => {
  mockGitHub(404);
  const res = await app.request("/realChriss/nope");
  expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  expect(await res.text()).toContain("Repository not found");
});

test("locks down cards opened as documents and logs paths undecoded", async () => {
  mockGitHub();
  const log = spyOn(console, "log").mockImplementation(() => {});
  const res = await app.request("/real%0AChriss/repora");
  const logged = log.mock.calls.flat().join("");
  log.mockRestore();
  expect(res.headers.get("content-security-policy")).toStartWith("default-src 'none'");
  expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  expect(logged).toContain("/real%0AChriss/repora");
});

test("skips the API for repos whose page is missing", async () => {
  const fetchMock = mockGitHub(404);
  expect(await (await app.request("/realChriss/nope")).text()).toContain("Repository not found");
  expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual(["https://github.com/realChriss/nope"]);
});

test("rejects invalid options before calling GitHub", async () => {
  const fetchMock = mockGitHub();
  for (const query of ["accent=red", "icon=../secret.png", "icon=https://evil.example/x.png", "style=nope", "scale=5"]) {
    const res = await app.request(`/realChriss/repora?${query}`);
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
  }
  expect(fetchMock).not.toHaveBeenCalled();
});

test("reports GitHub rate limiting", async () => {
  mockGitHub(403);
  expect(await (await app.request("/realChriss/repora")).text()).toContain("GitHub rate limit reached");
});

test("limits cache misses per client but never cached cards", async () => {
  mockGitHub();
  const card = async (path: string, ip = "1.1.1.1") =>
    (await app.request(path, { headers: { "cf-connecting-ip": ip } })).text();
  for (let i = 0; i < 20; i++) expect(await card(`/realChriss/repo${i}`)).not.toContain("Too many requests");
  expect(await card("/realChriss/repo20")).toContain("Too many requests");
  expect(await card("/realChriss/repo0")).not.toContain("Too many requests");
  expect(await card("/realChriss/repo20", "2.2.2.2")).not.toContain("Too many requests");
});

test("keeps serving the last good card while GitHub fails, but not for deleted repos", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  const expire = () => setSystemTime(new Date(Date.now() + 11 * 60_000));
  mockGitHub();
  await app.request("/realChriss/repora");
  expire();
  mockGitHub(403);
  const stale = await (await app.request("/realChriss/repora")).text();
  expire();
  mockGitHub(404);
  const deleted = await (await app.request("/realChriss/repora")).text();
  setSystemTime();
  warn.mockRestore();
  expect(stale).toContain("21k");
  expect(deleted).toContain("Repository not found");
});

test("reports GitHub timeouts", async () => {
  globalThis.fetch = (async () => {
    throw new DOMException("timed out", "TimeoutError");
  }) as unknown as typeof fetch;
  expect(await (await app.request("/realChriss/repora")).text()).toContain("GitHub is not responding");
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
  const body = await (await app.request("/someone/empty?style=solid")).text();
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
  const body = await (await app.request("/realChriss/repora?icon=big.png")).text();
  expect(body).not.toContain("data:image/png");
  expect(body).toContain(">R</text>");
});

test("serves the builder page and its assets", async () => {
  const page = await (await app.request("/")).text();
  expect(page).toContain('<div id="app"');
  expect(page).toContain("<h1>Repo cards for your README</h1>");
  expect(page).toContain(`href="https://github.com/realChriss/repora"`);

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
    const body = await (await app.request(`/realChriss/repora?style=${style}`)).text();
    expect(body).toContain("@font-face");
    expect(body.length).toBeLessThan(15_000);
  }
});

test("scopes svg ids per card so inlined cards do not collide", async () => {
  mockGitHub();
  const a = await (await app.request("/realChriss/repora?style=glow")).text();
  const b = await (await app.request("/realChriss/repora?style=glow&accent=FF8A5B")).text();
  const ids = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]!);
  expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);
  const refs = [...a.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]!);
  expect(refs.length).toBeGreaterThan(0);
  for (const ref of refs) expect(ids(a)).toContain(ref);
});

test("right-aligns right-to-left descriptions", async () => {
  mockGitHub(200, { description: "שלום עולם" });
  const body = await (await app.request("/realChriss/repora")).text();
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
        const served = await (await app.request(`/realChriss/repora?${params}`)).text();
        const query = cardQuery.parse(Object.fromEntries(params));
        const client = await renderRepoCard("realChriss", "repora", query, { embed: fullFont });
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
    await app.request("/realChriss/repora");
  } finally {
    if (token === undefined) delete Bun.env.GITHUB_TOKEN;
    else Bun.env.GITHUB_TOKEN = token;
  }
  expect(calls()).toEqual([
    ["https://github.com/realChriss/repora", null],
    ["https://api.github.com/repos/realChriss/repora", "Bearer secret"],
  ]);

  clearCache();
  fetchMock.mockClear();
  await renderRepoCard("realChriss", "repora", cardQuery.parse({}), { embed: fullFont });
  expect(calls().filter(([url]) => !url!.startsWith("http://localhost/"))).toEqual([
    ["https://api.github.com/repos/realChriss/repora", null],
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

test("explains the card URL to AI agents at /llms.txt", async () => {
  const res = await app.request("/llms.txt");
  expect(res.headers.get("content-type")).toContain("text/markdown");
  const doc = await res.text();
  expect(doc).toStartWith("# Repora");
  for (const option of Object.keys(cardQuery.shape)) expect(doc).toContain(`\`${option}\``);
  expect(doc).toContain("http://localhost/owner/repo");
});

test("every example URL in /llms.txt renders a card", async () => {
  mockGitHub();
  const doc = await (await app.request("/llms.txt")).text();
  const urls = [...doc.matchAll(/http:\/\/localhost(\/[\w.-]+\/[\w.-]+(?:\?[^\s)"]*)?)/g)].map((m) => m[1]!);
  expect(urls.length).toBeGreaterThan(5);
  for (const url of urls) {
    const res = await app.request(url);
    expect({ url, cache: res.headers.get("cache-control") }).toEqual({ url, cache: expect.stringContaining("max-age=1800") });
  }
});

test("points agents at the guide from the builder page", async () => {
  const page = await (await app.request("/")).text();
  expect(page).toContain('rel="alternate" type="text/markdown" href="/llms.txt"');
  expect(page).toContain('<a href="/llms.txt">llms.txt</a>');
});
