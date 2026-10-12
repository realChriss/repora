import { outline } from "./shape";
import type { Style } from "./types";

const INK = "#0b0c0e";

export const solid: Style = {
  font: "grotesk",
  colors: (accent) => ({
    bg: accent,
    fg: INK,
    title: INK,
    muted: INK,
    description: INK,
    star: INK,
    monogramBg: INK,
    monogramFg: accent,
    dot: INK,
  }),
  card: {
    padding: { top: 20, x: 22, bottom: 20 },
    iconSize: 30,
    iconRadius: 8,
    titleSize: 18,
    descriptionSize: 14,
    descriptionLineHeight: 1.5,
    metaSize: 13,
    metaGap: 18,
    metaWeight: 600,
    dotSize: 9,
  },
  pill: { padding: 7, iconSize: 28, fontSize: 14 },
  cardRadius: 14,
  Frame: (props) => <rect {...outline(props)} fill={props.colors.bg} />,
};
