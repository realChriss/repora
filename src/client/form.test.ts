import { expect, test } from "bun:test";
import { buildCard, effectiveColors, INITIAL_FORM, parseRepo, snippetFor, type Form } from "./form";

const ORIGIN = "https://repora.test";
const form = (changes: Partial<Form>): Form => ({ ...INITIAL_FORM, ...changes });

test("accepts owner/repo and pasted GitHub links", () => {
  for (const input of ["honojs/hono", " https://github.com/honojs/hono.git ", "github.com/honojs/hono/tree/main"]) {
    expect(parseRepo(input)).toEqual({ owner: "honojs", repo: "hono" });
  }
  expect(parseRepo("not a repo")).toBeUndefined();
});

test("leaves defaults out of the card URL", () => {
  expect(buildCard(INITIAL_FORM, ORIGIN).card?.url).toBe(`${ORIGIN}/honojs/hono`);
  const { card } = buildCard(
    form({ style: "glow", accent: "ff8a5b", width: 600, flags: { ...INITIAL_FORM.flags, show_forks: false } }),
    ORIGIN,
  );
  expect(card?.url).toBe(`${ORIGIN}/honojs/hono?style=glow&accent=FF8A5B&width=600&show_forks=false`);
});

test("reports invalid options and previews without them", () => {
  const { card, errors } = buildCard(form({ accent: "zzz", icon: "../secret.png", bg: "101820" }), ORIGIN);
  expect(errors.accent).toBe("Must be a hex color like 4FB3FF.");
  expect(errors.icon).toBe("Must not contain . or .. segments.");
  expect(card?.url).toBe(`${ORIGIN}/honojs/hono?bg=101820`);
  expect(card?.query.accent).toBe("#4FB3FF");
});

test("reports a bad repo only once something is typed", () => {
  expect(buildCard(form({ repo: "" }), ORIGIN)).toEqual({ errors: {} });
  expect(buildCard(form({ repo: "nope" }), ORIGIN).errors.repo).toBe("Enter it as owner/repo, like honojs/hono.");
});

test("snippets link the card to its repo", () => {
  const card = buildCard(INITIAL_FORM, ORIGIN).card!;
  expect(snippetFor(card, "markdown")).toBe(`[![honojs/hono](${ORIGIN}/honojs/hono)](https://github.com/honojs/hono)`);
  expect(snippetFor(card, "html")).toBe(
    `<a href="https://github.com/honojs/hono"><img src="${ORIGIN}/honojs/hono" alt="honojs/hono" /></a>`,
  );
});

test("empty or invalid custom colors fall back to the style's colors", () => {
  expect(effectiveColors(INITIAL_FORM)).toEqual({ accent: "#4FB3FF", bg: "#0D1117", fg: "#EEF0F3", muted: "#A4ABB5" });
  expect(effectiveColors(form({ style: "bar", bg: "abc", fg: "nope" }))).toMatchObject({ bg: "#ABC", fg: "#1B1D20" });
});
