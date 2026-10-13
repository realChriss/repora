import { create, type Font } from "fontkit";

export const FONT_NAMES = ["plex", "fira", "grotesk", "inter"] as const;
export type FontName = (typeof FONT_NAMES)[number];
export const FONT_WEIGHTS = [400, 600] as const;
export type FontWeight = (typeof FONT_WEIGHTS)[number];

interface FontInfo {
  pkg: string;
  family: string;
  stack: string;
}

export const FONTS: Record<FontName, FontInfo> = {
  plex: { pkg: "ibm-plex-sans", family: "IBM Plex Sans", stack: "'IBM Plex Sans',sans-serif" },
  fira: { pkg: "fira-code", family: "Fira Code", stack: "'Fira Code',monospace" },
  grotesk: { pkg: "space-grotesk", family: "Space Grotesk", stack: "'Space Grotesk',sans-serif" },
  inter: { pkg: "inter", family: "Inter", stack: "'Inter',-apple-system,'Segoe UI',sans-serif" },
};

export const fontFile = (name: FontName, weight: FontWeight) => `${name}-${weight}.woff2`;

const loaded = new Map<string, Font>();

export function addFont(name: FontName, weight: FontWeight, bytes: Uint8Array) {
  loaded.set(fontFile(name, weight), create(bytes as Buffer) as Font);
}

const ZERO_WIDTH = /[​-‏︀-️]/u;
const EMOJI = /[☀-➿\u{1F000}-\u{1FAFF}]/u;
const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿＀-｠]/u;

// Errs wide: the viewer's fallback font draws these, and emoji widths differ per OS.
function fallbackWidth(char: string): number {
  if (ZERO_WIDTH.test(char)) return 0;
  if (EMOJI.test(char)) return 1.35;
  return WIDE.test(char) ? 1 : 0.55;
}

export function measure(text: string, name: FontName, weight: FontWeight, size: number): number {
  const font = loaded.get(fontFile(name, weight));
  if (!font) throw new Error(`Font ${fontFile(name, weight)} is not loaded`);
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

export type Embed = (name: FontName, weight: FontWeight, chars: string) => Promise<string>;

// Inlined because SVGs rendered via <img> cannot load external fonts.
export async function fontFaceCss(name: FontName, text: string, embed: Embed): Promise<string> {
  const { family } = FONTS[name];
  const chars = [...new Set(text)].sort().join("");
  const rules = await Promise.all(
    FONT_WEIGHTS.map(
      async (weight) =>
        `@font-face{font-family:'${family}';font-weight:${weight};` +
        `src:url(data:font/woff2;base64,${await embed(name, weight, chars)}) format('woff2')}`,
    ),
  );
  return rules.join("");
}
