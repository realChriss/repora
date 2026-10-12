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
  /** Background of meta chips; meta items render as plain text when unset. */
  chip?: string;
  /** Replaces the language color for the dot, e.g. on accent-filled cards. */
  dot?: string;
}

export interface FrameProps {
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
  /** Extra attributes for the title text and language dot, e.g. a filter defined by the Frame. */
  titleProps?: Record<string, string>;
  dotProps?: Record<string, string>;
  Frame: FC<FrameProps>;
}
