import { readFileSync } from "node:fs";
import { create, type Font } from "fontkit";
import subsetFont from "subset-font";
import { memo } from "../cache";

export type FontName = "plex" | "fira" | "grotesk" | "inter";
export type FontWeight = 400 | 600;

interface FontFiles {
  family: string;
  stack: string;
  files: Record<FontWeight, string>;
}

export const fontsourceFile = (pkg: string, weight: FontWeight) =>
  Bun.resolveSync(`@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff2`, import.meta.dir);

const fontsource = (pkg: string) => ({
  400: fontsourceFile(pkg, 400),
  600: fontsourceFile(pkg, 600),
});

const FONTS: Record<FontName, FontFiles> = {
  plex: { family: "IBM Plex Sans", stack: "'IBM Plex Sans',sans-serif", files: fontsource("ibm-plex-sans") },
  fira: { family: "Fira Code", stack: "'Fira Code',monospace", files: fontsource("fira-code") },
  grotesk: { family: "Space Grotesk", stack: "'Space Grotesk',sans-serif", files: fontsource("space-grotesk") },
  inter: { family: "Inter", stack: "'Inter',-apple-system,'Segoe UI',sans-serif", files: fontsource("inter") },
};

interface LoadedFont {
  buffer: Buffer;
  font: Font;
}

const loaded = new Map<string, LoadedFont>();

function load(name: FontName, weight: FontWeight): LoadedFont {
  const path = FONTS[name].files[weight];
  let entry = loaded.get(path);
  if (!entry) {
    const buffer = readFileSync(path);
    entry = { buffer, font: create(buffer) as Font };
    loaded.set(path, entry);
  }
  return entry;
}

const ZERO_WIDTH = /[\u200B-\u200F\uFE00-\uFE0F]/u;
const EMOJI = /[\u2600-\u27BF\u{1F000}-\u{1FAFF}]/u;
const WIDE = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFF00-\uFF60]/u;

// Errs wide: the viewer's fallback font draws these, and emoji widths differ per OS.
function fallbackWidth(char: string): number {
  if (ZERO_WIDTH.test(char)) return 0;
  if (EMOJI.test(char)) return 1.35;
  return WIDE.test(char) ? 1 : 0.55;
}

export function measure(text: string, name: FontName, weight: FontWeight, size: number): number {
  const { font } = load(name, weight);
  let supported = "";
  let fallbackEm = 0;
  for (const char of text) {
    if (font.hasGlyphForCodePoint(char.codePointAt(0)!)) supported += char;
    else fallbackEm += fallbackWidth(char);
  }
  return (font.layout(supported).advanceWidth / font.unitsPerEm + fallbackEm) * size;
}

export function fontStack(name: FontName): string {
  return FONTS[name].stack;
}

const HOUR = 60 * 60_000;

function subsetBase64(name: FontName, weight: FontWeight, chars: string): Promise<string> {
  return memo(`font:${name}:${weight}:${chars}`, HOUR, async () => {
    const subset = await subsetFont(load(name, weight).buffer, chars, {
      targetFormat: "woff2",
      noHinting: true,
      noLayoutClosure: true,
    });
    return Buffer.from(subset).toString("base64");
  });
}

// Inlined because SVGs rendered via <img> cannot load external fonts.
export async function fontFaceCss(name: FontName, text: string): Promise<string> {
  const { family } = FONTS[name];
  const chars = [...new Set(text)].sort().join("");
  const rules = await Promise.all(
    ([400, 600] as const).map(
      async (weight) =>
        `@font-face{font-family:'${family}';font-weight:${weight};` +
        `src:url(data:font/woff2;base64,${await subsetBase64(name, weight, chars)}) format('woff2')}`,
    ),
  );
  return rules.join("");
}
