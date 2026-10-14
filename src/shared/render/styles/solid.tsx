import { readableInk } from "../color";
import { outline } from "./shape";
import type { Style } from "./types";

export const solid: Style = {
  font: "grotesk",
  colors: (accent) => {
    const ink = readableInk(accent);
    return {
      bg: accent,
      title: ink,
      muted: ink,
      description: ink,
      star: ink,
      monogramBg: ink,
      monogramFg: accent,
      dot: ink,
    };
  },
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
