import { expect, test } from "bun:test";
import "../../server/fonts";
import { STYLE_NAMES, type StyleName } from "../card-options";
import { contrast, ensureContrast, mix, readableInk } from "./color";
import type { Embed } from "./fonts";
import { renderSvg, type Appearance, type CardContent } from "./index";
import { styles } from "./styles";

const CONTENT: CardContent = {
  owner: "realChriss",
  name: "repora",
  description: "Cards",
  language: "TypeScript",
  stars: 21000,
  forks: 600,
};

const embed: Embed = async () => "";

const render = (style: StyleName, changes: Partial<Appearance> = {}) =>
  renderSvg(CONTENT, { style, layout: "card", accent: "#ff0000", width: 460, scale: 1, ...changes }, embed);

function fillOf(svg: string, text: string): string | undefined {
  const before = svg.slice(0, svg.lastIndexOf(`>${text}<`));
  return [...before.matchAll(/fill="([^"]+)"/g)].at(-1)?.[1];
}

const sizeOf = (svg: string) => svg.match(/<svg[^>]* width="(\d+)" height="(\d+)"/)!.slice(1).map(Number);

test("fg colors the title, muted the rest, and the star uses the accent on every style", async () => {
  for (const style of STYLE_NAMES) {
    const svg = await render(style, { fg: "#fee715", muted: "#9a9a9a" });
    const star = ensureContrast("#ff0000", styles[style].colors("#ff0000").bg);
    const title = styles[style].splitOwner ? ["realChriss / ", "repora"] : ["realChriss/repora"];
    const fills = Object.fromEntries(
      [...title, "Cards", "TypeScript", "600 forks", "21k"].map((text) => [text, fillOf(svg, text)]),
    );
    expect({ style, fills }).toEqual({
      style,
      fills: {
        ...Object.fromEntries(title.map((text) => [text, "#fee715"])),
        Cards: "#9a9a9a",
        TypeScript: "#9a9a9a",
        "600 forks": "#9a9a9a",
        "21k": star,
      },
    });
  }
});

test("the star keeps the exact accent unless the actual background makes it unreadable", async () => {
  expect(fillOf(await render("solid", { accent: "#ffe600", bg: "#0d1117" }), "21k")).toBe("#ffe600");
  const star = fillOf(await render("solid", { accent: "#ffe600", bg: "#ffffff" }), "21k")!;
  expect(star).not.toBe("#ffe600");
  expect(contrast(star, "#ffffff")).toBeGreaterThanOrEqual(4.5);
});

test("a style margin can pad every side or only the right and bottom", async () => {
  const plain = sizeOf(await render("rim"));
  const brutal = await render("brutal");
  expect(sizeOf(brutal)).toEqual([plain[0]! + 5, sizeOf(brutal)[1]!]);
  expect(brutal).toContain('transform="translate(0 0)"');
  const glow = await render("glow");
  expect(sizeOf(glow)[0]).toBe(plain[0]! + 16);
  expect(glow).toContain('transform="translate(8 8)"');
});

test("the bar border follows the background", async () => {
  for (const bg of [undefined, "#111418"]) {
    const base = bg ?? styles.bar.colors("#ff0000").bg;
    expect(await render("bar", { bg })).toContain(`stroke="${mix(readableInk(base), base, 0.12)}"`);
  }
});
