import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { clearCache } from "./cache";
import { app } from "./index";
import { renderError } from "./render";
import { STYLE_NAMES } from "./card-options";

const realFetch = globalThis.fetch;

function mockGitHub(status = 200, repo: Record<string, unknown> = {}) {
  const fetchMock = mock(async (url: string | URL | Request) => {
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
  for (const query of ["accent=red", "icon=../secret.png", "icon=https://evil.example/x.png", "style=nope"]) {
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
  expect(page).toContain('<form id="builder"');
  expect(page.match(/name="style"/g)?.length).toBe(STYLE_NAMES.length);

  const script = await app.request("/assets/builder.js");
  expect(script.headers.get("content-type")).toContain("javascript");
  expect(await script.text()).toContain("history.replaceState");

  const css = await app.request("/assets/builder.css");
  expect(css.headers.get("content-type")).toContain("text/css");

  const font = await app.request("/assets/fonts/plex-sans-400.woff2");
  expect(font.headers.get("content-type")).toBe("font/woff2");
  expect((await font.arrayBuffer()).byteLength).toBeGreaterThan(1000);

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
