import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";
import { etag } from "hono/etag";
import type { core } from "zod";
import { builder } from "./builder";
import { GitHubError } from "./github";
import { cardQuery, repoParams } from "./options";
import { renderError } from "./render";
import { renderRepoCard } from "./repo-card";

const CACHE_OK = "public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400";
const CACHE_ERROR = "public, max-age=60";

// Errors are sent as 200 so GitHub's image proxy shows the error card instead of a broken image.
function svg(c: Context, body: string, cacheControl = CACHE_OK) {
  c.header("Content-Type", "image/svg+xml; charset=utf-8");
  c.header("Cache-Control", cacheControl);
  return c.body(body);
}

const errorSvg = (c: Context, message: string) => svg(c, renderError(message), CACHE_ERROR);

const onInvalid = (result: { success: boolean; error?: core.$ZodError }, c: Context) => {
  if (result.success || !result.error) return;
  const issue = result.error.issues[0];
  return errorSvg(c, issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid request");
};

export const app = new Hono();

app.use(etag());

app.route("/", builder);

app.get(
  "/:owner/:repo",
  zValidator("param", repoParams, onInvalid),
  zValidator("query", cardQuery, onInvalid),
  async (c) => {
    const { owner, repo } = c.req.valid("param");
    return svg(c, await renderRepoCard(owner, repo, c.req.valid("query")));
  },
);

app.onError((error, c) => {
  if (error instanceof GitHubError) return errorSvg(c, error.message);
  console.error(error);
  return errorSvg(c, "Something went wrong");
});

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
};
