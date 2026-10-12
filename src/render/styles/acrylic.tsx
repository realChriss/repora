import { mix } from "../color";
import { outline } from "./shape";
import type { Style } from "./types";

export const acrylic: Style = {
  font: "system",
  colors: (accent) => ({
    bg: "#0b0d12",
    fg: "#eef0f3",
    title: "#eef0f3",
    muted: "#a4abb5",
    description: "#a4abb5",
    star: accent,
    monogramBg: accent,
    monogramFg: "#0a0c10",
  }),
  card: {
    padding: { top: 20, x: 22, bottom: 20 },
    iconSize: 28,
    iconRadius: 7,
    titleSize: 16,
    descriptionSize: 13.5,
    descriptionLineHeight: 1.5,
    metaSize: 12.5,
    metaGap: 18,
    metaWeight: 400,
    dotSize: 9,
  },
  pill: { padding: 7, iconSize: 26, fontSize: 13.5 },
  cardRadius: 12,
  Frame: (props) => {
    const { layout, width, height, colors } = props;
    const sheen = { x: -0.1 * width, y: -0.4 * height, width: 0.45 * width, height: 1.8 * height };
    const sheenCenter = `${sheen.x + sheen.width / 2} ${sheen.y + sheen.height / 2}`;
    return (
      <>
        <defs>
          <linearGradient id="fill" x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0" stop-color={mix("#ffffff", colors.bg, 0.12)} />
            <stop offset="1" stop-color={colors.bg} />
          </linearGradient>
          <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.28" />
            <stop offset="0.2" stop-color="#ffffff" stop-opacity="0.1" />
          </linearGradient>
          <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
            <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.07" />
            <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
          </linearGradient>
          <clipPath id="shape">
            <rect {...outline(props)} />
          </clipPath>
        </defs>
        <rect {...outline(props)} fill="url(#fill)" />
        {layout === "card" && (
          <g clip-path="url(#shape)">
            <rect {...sheen} fill="url(#sheen)" transform={`rotate(25 ${sheenCenter})`} />
          </g>
        )}
        <rect {...outline(props, 1)} fill="none" stroke="url(#edge)" stroke-width="1" />
      </>
    );
  },
};
