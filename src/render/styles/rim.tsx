import { mix } from "../color";
import { outline } from "./shape";
import type { Style } from "./types";

const STROKE = 1.5;

export const rim: Style = {
  font: "plex",
  colors: (accent) => ({
    bg: "#0d1117",
    fg: "#eef0f3",
    title: "#eef0f3",
    muted: "#a4abb5",
    description: "#a4abb5",
    star: accent,
    monogramBg: "url(#monogram)",
    monogramFg: "#0a0c10",
  }),
  card: {
    padding: { top: 20, x: 22, bottom: 20 },
    iconSize: 30,
    iconRadius: 8,
    titleSize: 17,
    descriptionSize: 13.5,
    descriptionLineHeight: 1.5,
    metaSize: 12.5,
    metaGap: 18,
    metaWeight: 400,
    dotSize: 9,
  },
  pill: { padding: 7.5, iconSize: 28, fontSize: 13.5 },
  cardRadius: 16,
  Frame: (props) => {
    const { layout, colors, accent } = props;
    return (
      <>
        <defs>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2={layout === "card" ? "1" : "0"}>
            <stop offset="0" stop-color={accent} />
            <stop offset={layout === "card" ? "0.45" : "0.5"} stop-color={accent} stop-opacity="0.2" />
            <stop offset="1" stop-color="#ffffff" stop-opacity="0.35" />
          </linearGradient>
          <linearGradient id="monogram" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color={accent} />
            <stop offset="1" stop-color={mix(accent, "#0d1117", 0.5)} />
          </linearGradient>
        </defs>
        <rect {...outline(props, STROKE)} fill={colors.bg} stroke="url(#rim)" stroke-width={STROKE} />
      </>
    );
  },
};
