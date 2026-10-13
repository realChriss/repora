import { readFileSync } from "node:fs";
import subsetFont from "subset-font";
import { memo } from "../shared/cache";
import { addFont, FONT_NAMES, FONT_WEIGHTS, FONTS, fontFile, type Embed, type FontName, type FontWeight } from "../shared/render/fonts";

export const fontsourceFile = (name: FontName, weight: FontWeight) =>
  Bun.resolveSync(`@fontsource/${FONTS[name].pkg}/files/${FONTS[name].pkg}-latin-${weight}-normal.woff2`, import.meta.dir);

const buffers = new Map<string, Buffer>();

for (const name of FONT_NAMES) {
  for (const weight of FONT_WEIGHTS) {
    const buffer = readFileSync(fontsourceFile(name, weight));
    buffers.set(fontFile(name, weight), buffer);
    addFont(name, weight, buffer);
  }
}

const HOUR = 60 * 60_000;

export const embedSubset: Embed = (name, weight, chars) =>
  memo(`font:${name}:${weight}:${chars}`, HOUR, async () => {
    const subset = await subsetFont(buffers.get(fontFile(name, weight))!, chars, {
      targetFormat: "woff2",
      noHinting: true,
      noLayoutClosure: true,
    });
    return Buffer.from(subset).toString("base64");
  });
