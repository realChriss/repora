import { acrylic } from "./acrylic";
import { bar } from "./bar";
import { brutal } from "./brutal";
import { glow } from "./glow";
import { rim } from "./rim";
import { solid } from "./solid";
import type { StyleName } from "../../card-options";
import type { Style } from "./types";

export const styles: Record<StyleName, Style> = { acrylic, rim, glow, bar, solid, brutal };
