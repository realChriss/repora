import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";
import { etag } from "hono/etag";
import { MemoryStore, rateLimiter } from "hono-rate-limiter";
import type { core } from "zod";
import { builder } from "./builder";
import { isFresh } from "../shared/cache";
import { GitHubError, repoKey } from "../shared/github";
import { closeLog, logRequest } from "./log";
import { cardQuery, repoParams } from "../shared/options";
import { renderError } from "../shared/render";
import { embedSubset } from "./fonts";
import { assertRepoPage } from "./repo-page";
import { renderRepoCard } from "../shared/repo-card";

const CACHE_OK = "public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400";
const CACHE_ERROR = "public, max-age=60";

// Errors are sent as 200 so GitHub's image proxy shows the error card instead of a broken image.
function svg(c: Context, body: string, cacheControl = CACHE_OK) {
  c.header("Content-Type", "image/svg+xml; charset=utf-8");
  c.header("Cache-Control", cacheControl);
  c.header("Content-Security-Policy", "default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'");
  c.header("X-Content-Type-Options", "nosniff");
  return c.body(body);
}

// c.req.path is percent-decoded, so %0A would start a forged log line.
const rawPath = (c: Context) => new URL(c.req.url).pathname;

function errorSvg(c: Context, message: string) {
  logRequest(`fail ${rawPath(c)}: ${message}`);
  return svg(c, renderError(message), CACHE_ERROR);
}

const onInvalid = (result: { success: boolean; error?: core.$ZodError }, c: Context) => {
  if (result.success || !result.error) return;
  const issue = result.error.issues[0];
  return errorSvg(c, issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid request");
};

// Only cache misses
export const missStore = new MemoryStore();
const missLimiter = rateLimiter({
  windowMs: 60_000,
  limit: 20,
  store: missStore,
  // Behind a Cloudflare tunnel the socket is cloudflared, so the visitor is only in this header.
  keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? (c.env as Bun.Server<unknown> | undefined)?.requestIP(c.req.raw)?.address ?? "",
  skip: (c) => isFresh(repoKey(c.req.param("owner")!, c.req.param("repo")!)),
  handler: (c) => errorSvg(c, "Too many requests, try again in a minute"),
});

export const app = new Hono();

app.use(etag());

app.route("/", builder);

app.get(
  "/:owner/:repo",
  zValidator("param", repoParams, onInvalid),
  zValidator("query", cardQuery, onInvalid),
  missLimiter,
  async (c) => {
    const { owner, repo } = c.req.valid("param");
    const body = await renderRepoCard(owner, repo, c.req.valid("query"), {
      embed: embedSubset,
      github: { token: Bun.env.GITHUB_TOKEN, beforeFetch: assertRepoPage },
    });
    logRequest(`ok   ${rawPath(c)}`);
    return svg(c, body);
  },
);

app.onError((error, c) => {
  if (error instanceof GitHubError) return errorSvg(c, error.message);
  console.error(error);
  return errorSvg(c, "Something went wrong");
});

if (import.meta.main) {
  const server = Bun.serve({ port: Number(Bun.env.PORT ?? 3000), fetch: app.fetch });
  console.log(`Listening on ${server.url}`);

  process.on("SIGTERM", async () => {
    await server.stop();
    await closeLog();
    process.exit(0);
  });
}
