import type { FC } from "hono/jsx";
import type { FontName, FontWeight } from "../fonts";

export type Layout = "card" | "pill";

export interface Colors {
  bg: string;
  fg: string;
  title: string;
  muted: string;
  description: string;
  star: string;
  monogramBg: string;
  monogramFg: string;
  monogramStroke?: string;
  /** Draws the monogram background as a diagonal gradient between these colors. */
  monogramGradient?: [string, string];
  /** Background of meta chips; meta items render as plain text when unset. */
  chip?: string;
  /** Replaces the language color for the dot, e.g. on accent-filled cards. */
  dot?: string;
}

/** Makes an SVG id unique to one card, so cards inlined into the same page do not share defs. */
export type IdFor = (name: string) => string;

export interface FrameProps {
  id: IdFor;
  layout: Layout;
  width: number;
  height: number;
  radius: number;
  colors: Colors;
  accent: string;
}

export interface CardMetrics {
  padding: { top: number; x: number; bottom: number };
  iconSize: number;
  iconRadius: number;
  titleSize: number;
  descriptionSize: number;
  descriptionLineHeight: number;
  metaSize: number;
  metaGap: number;
  metaWeight: FontWeight;
  dotSize: number;
}

export interface PillMetrics {
  padding: number;
  iconSize: number;
  fontSize: number;
  /** Extra left padding, e.g. for an accent bar on the left edge. */
  leftInset?: number;
}

export interface Style {
  font: FontName;
  colors: (accent: string) => Colors;
  card: CardMetrics;
  pill: PillMetrics;
  cardRadius: number;
  /** Defaults to fully rounded. */
  pillRadius?: number;
  /** Space around the card for effects drawn outside it, like glows. */
  margin?: number;
  /** Shows the title as a muted "owner / " followed by the repo name. */
  splitOwner?: boolean;
  /** Names of filters defined by the Frame, applied to the title text and language dot. */
  titleFilter?: string;
  dotFilter?: string;
  Frame: FC<FrameProps>;
}
