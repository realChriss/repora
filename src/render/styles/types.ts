import type { FC } from "hono/jsx";
import type { Layout } from "../../card-options";
import type { FontName, FontWeight } from "../fonts";

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
  monogramGradient?: [string, string];
  chip?: string;
  dot?: string;
}

// Per-card ids, so cards inlined into one HTML page do not share defs.
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
  leftInset?: number;
}

export interface Style {
  font: FontName;
  colors: (accent: string) => Colors;
  card: CardMetrics;
  pill: PillMetrics;
  cardRadius: number;
  pillRadius?: number;
  margin?: number;
  splitOwner?: boolean;
  titleFilter?: string;
  dotFilter?: string;
  Frame: FC<FrameProps>;
}
