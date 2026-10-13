import { acrylic } from "./acrylic";
import { bar } from "./bar";
import { glow } from "./glow";
import { rim } from "./rim";
import { solid } from "./solid";
import { tinted } from "./tinted";
import type { StyleName } from "../../card-options";
import type { Style } from "./types";

export const styles: Record<StyleName, Style> = { acrylic, rim, tinted, glow, bar, solid };
