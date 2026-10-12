import { readFileSync } from "node:fs";
import { create, type Font } from "fontkit";

export type FontName = "plex" | "fira" | "grotesk" | "system";
export type FontWeight = 400 | 600;

interface FontFiles {
  family: string;
  stack: string;
  files: Record<FontWeight, string>;
}

const fontsourceFile = (pkg: string, weight: FontWeight) =>
  Bun.resolveSync(`@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff2`, import.meta.dir);

const fontsource = (pkg: string) => ({
  400: fontsourceFile(pkg, 400),
  600: fontsourceFile(pkg, 600),
});

const FONTS: Record<FontName, FontFiles> = {
  plex: { family: "IBM Plex Sans", stack: "'IBM Plex Sans',sans-serif", files: fontsource("ibm-plex-sans") },
  fira: { family: "Fira Code", stack: "'Fira Code',monospace", files: fontsource("fira-code") },
  grotesk: { family: "Space Grotesk", stack: "'Space Grotesk',sans-serif", files: fontsource("space-grotesk") },
  // ponytail: system stack is measured with Plex metrics, close to Segoe UI / SF; widths may be off by a few px.
  system: { family: "", stack: "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif", files: fontsource("ibm-plex-sans") },
};

interface LoadedFont {
  base64: string;
  font: Font;
}

const loaded = new Map<string, LoadedFont>();

function load(name: FontName, weight: FontWeight): LoadedFont {
  const path = FONTS[name].files[weight];
  let entry = loaded.get(path);
  if (!entry) {
    const buffer = readFileSync(path);
    entry = { base64: buffer.toString("base64"), font: create(buffer) as Font };
    loaded.set(path, entry);
  }
  return entry;
}

export function measure(text: string, name: FontName, weight: FontWeight, size: number): number {
  const { font } = load(name, weight);
  const scale = size / font.unitsPerEm;
  return font
    .layout(text)
    .glyphs.reduce((width, glyph) => width + (glyph.id === 0 ? font.unitsPerEm : glyph.advanceWidth) * scale, 0);
}

export function fontStack(name: FontName): string {
  return FONTS[name].stack;
}

/** `@font-face` rules with the font inlined, since SVGs in `<img>` can't load external files. */
export function fontFaceCss(name: FontName): string {
  const { family } = FONTS[name];
  if (!family) return "";
  return ([400, 600] as const)
    .map(
      (weight) =>
        `@font-face{font-family:'${family}';font-weight:${weight};` +
        `src:url(data:font/woff2;base64,${load(name, weight).base64}) format('woff2')}`,
    )
    .join("");
}
