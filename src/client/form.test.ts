import { expect, test } from "bun:test";
import { buildCard, effectiveColors, INITIAL_FORM, parseRepo, snippetFor, type Form } from "./form";

const ORIGIN = "https://repora.test";
const form = (changes: Partial<Form>): Form => ({ ...INITIAL_FORM, ...changes });

test("accepts owner/repo and pasted GitHub links", () => {
  for (const input of ["oven-sh/bun", " https://github.com/oven-sh/bun.git ", "github.com/oven-sh/bun/tree/main"]) {
    expect(parseRepo(input)).toEqual({ owner: "oven-sh", repo: "bun" });
  }
  expect(parseRepo("not a repo")).toBeUndefined();
});

test("leaves defaults out of the card URL", () => {
  expect(buildCard(INITIAL_FORM, ORIGIN).card?.url).toBe(`${ORIGIN}/oven-sh/bun?icon=docs/icons/bun.svg`);
  expect(buildCard(form({ icon: "" }), ORIGIN).card?.url).toBe(`${ORIGIN}/oven-sh/bun`);
  const { card } = buildCard(
    form({ style: "glow", accent: "ff8a5b", width: 600, flags: { ...INITIAL_FORM.flags, show_forks: false } }),
    ORIGIN,
  );
  expect(card?.url).toBe(`${ORIGIN}/oven-sh/bun?style=glow&accent=FF8A5B&width=600&icon=docs/icons/bun.svg&show_forks=false`);
});

test("reports invalid options and previews without them", () => {
  const { card, errors } = buildCard(form({ accent: "zzz", icon: "../secret.png", bg: "101820" }), ORIGIN);
  expect(errors.accent).toBe("Must be a hex color like 4FB3FF.");
  expect(errors.icon).toBe("Must not contain . or .. segments.");
  expect(card?.url).toBe(`${ORIGIN}/oven-sh/bun?bg=101820`);
  expect(card?.query.accent).toBe("#4FB3FF");
});

test("reports a bad repo only once something is typed", () => {
  expect(buildCard(form({ repo: "" }), ORIGIN)).toEqual({ errors: {} });
  expect(buildCard(form({ repo: "nope" }), ORIGIN).errors.repo).toBe("Enter it as owner/repo, like oven-sh/bun.");
});

test("snippets link the card to its repo", () => {
  const card = buildCard(form({ icon: "" }), ORIGIN).card!;
  expect(snippetFor(card, "markdown")).toBe(`[![oven-sh/bun](${ORIGIN}/oven-sh/bun)](https://github.com/oven-sh/bun)`);
  expect(snippetFor(card, "html")).toBe(
    `<a href="https://github.com/oven-sh/bun"><img src="${ORIGIN}/oven-sh/bun" alt="oven-sh/bun" /></a>`,
  );
});

test("empty or invalid custom colors fall back to the style's colors", () => {
  expect(effectiveColors(INITIAL_FORM)).toEqual({ accent: "#4FB3FF", bg: "#0D1117", fg: "#EEF0F3", muted: "#A4ABB5" });
  expect(effectiveColors(form({ style: "bar", bg: "abc", fg: "nope" }))).toMatchObject({ bg: "#ABC", fg: "#1B1D20" });
});
