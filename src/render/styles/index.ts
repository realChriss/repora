import { acrylic } from "./acrylic";
import { bar } from "./bar";
import { glow } from "./glow";
import { rim } from "./rim";
import { solid } from "./solid";
import { tinted } from "./tinted";
import type { Style } from "./types";

export const STYLE_NAMES = ["acrylic", "rim", "tinted", "glow", "bar", "solid"] as const;
export type StyleName = (typeof STYLE_NAMES)[number];

export const styles: Record<StyleName, Style> = { acrylic, rim, tinted, glow, bar, solid };
