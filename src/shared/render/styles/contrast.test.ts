import { expect, test } from "bun:test";
import { STYLE_NAMES } from "../../card-options";
import { contrast, ensureContrast } from "../color";
import { styles } from "./index";

const ACCENTS = ["#4FB3FF", "#FFE600", "#4ADE9B", "#1E3A8A", "#7F1D1D", "#111111", "#FFFFFF"];

test("text stays readable on every style for light and dark accents", () => {
  for (const name of STYLE_NAMES) {
    for (const accent of ACCENTS) {
      const c = styles[name].colors(accent);
      const bg = c.bg;
      const monogramBg = c.monogramGradient?.[0] ?? (c.monogramBg === "none" ? bg : c.monogramBg);
      const checks: [string, string, string, number][] = [
        ["title", c.title, bg, 4.5],
        ["muted", c.muted, bg, 4.5],
        ["star", ensureContrast(accent, bg), bg, 4.5],
        ["monogram", c.monogramFg, monogramBg, 3],
      ];
      for (const [label, fg, back, min] of checks) {
        expect({ name, accent, label, ok: contrast(fg, back) >= min }).toEqual({ name, accent, label, ok: true });
      }
    }
  }
});
