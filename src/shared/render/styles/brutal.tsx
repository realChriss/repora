import { mix, readableInk } from "../color";
import { outline } from "./shape";
import type { Style } from "./types";

const INK = "#111111";
const SHADOW = 5;
const BORDER = 2;

export const brutal: Style = {
  font: "grotesk",
  colors: (accent) => ({
    bg: mix(accent, "#ffffff", 0.2),
    title: INK,
    muted: "#383838",
    description: "#383838",
    star: INK,
    monogramBg: accent,
    monogramFg: readableInk(accent),
    monogramStroke: INK,
  }),
  card: {
    padding: { top: 20, x: 22, bottom: 20 },
    iconSize: 30,
    iconRadius: 6,
    titleSize: 18,
    descriptionSize: 14,
    descriptionLineHeight: 1.5,
    metaSize: 13,
    metaGap: 18,
    metaWeight: 600,
    dotSize: 10,
  },
  pill: { padding: 7, iconSize: 28, fontSize: 14 },
  cardRadius: 10,
  margin: { right: SHADOW, bottom: SHADOW },
  Frame: (props) => {
    const { colors, accent } = props;
    const shape = outline(props, BORDER);
    return (
      <>
        <rect {...shape} x={shape.x + SHADOW} y={shape.y + SHADOW} fill={accent} stroke={INK} stroke-width={BORDER} />
        <rect {...shape} fill={colors.bg} stroke={INK} stroke-width={BORDER} />
      </>
    );
  },
};
