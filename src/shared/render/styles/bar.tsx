import { mix, readableInk } from "../color";
import { outline } from "./shape";
import type { Style } from "./types";

const BAR = 4;

export const bar: Style = {
  font: "inter",
  colors: () => ({
    bg: "#ffffff",
    fg: "#1b1d20",
    title: "#1b1d20",
    muted: "#4b5058",
    description: "#4b5058",
    star: "#4b5058",
    monogramBg: "#f1f1ee",
    monogramFg: "#1b1d20",
  }),
  card: {
    padding: { top: 18 + BAR, x: 22, bottom: 20 },
    iconSize: 28,
    iconRadius: 14,
    titleSize: 16,
    descriptionSize: 13.5,
    descriptionLineHeight: 1.5,
    metaSize: 12.5,
    metaGap: 18,
    metaWeight: 400,
    dotSize: 10,
  },
  pill: { padding: 7, iconSize: 26, fontSize: 13.5, leftInset: BAR },
  cardRadius: 8,
  pillRadius: 8,
  splitOwner: true,
  Frame: (props) => {
    const { id, layout, width, height, colors, accent } = props;
    const accentBar = layout === "card" ? { width, height: BAR } : { width: BAR, height };
    return (
      <>
        <defs>
          <clipPath id={id("shape")}>
            <rect {...outline(props)} />
          </clipPath>
        </defs>
        <rect {...outline(props, 1)} fill={colors.bg} stroke={mix(readableInk(colors.bg), colors.bg, 0.12)} stroke-width="1" />
        <rect {...accentBar} fill={accent} clip-path={`url(#${id("shape")})`} />
      </>
    );
  },
};
