import { ensureContrast } from "../color";
import { outline } from "./shape";
import type { Style } from "./types";

const BG = "#07090c";

export const glow: Style = {
  font: "fira",
  colors: (accent) => {
    const lit = ensureContrast(accent, BG);
    return {
      bg: BG,
      title: lit,
      muted: "#98a0ab",
      description: "#98a0ab",
      star: "#98a0ab",
      monogramBg: "none",
      monogramFg: lit,
      monogramStroke: lit,
    };
  },
  card: {
    padding: { top: 20, x: 22, bottom: 20 },
    iconSize: 28,
    iconRadius: 6,
    titleSize: 16,
    descriptionSize: 12.5,
    descriptionLineHeight: 1.6,
    metaSize: 12,
    metaGap: 18,
    metaWeight: 400,
    dotSize: 8,
  },
  pill: { padding: 7, iconSize: 26, fontSize: 12.5 },
  cardRadius: 12,
  margin: 8,
  titleFilter: "text-glow",
  dotFilter: "dot-glow",
  Frame: (props) => {
    const { id, colors, accent } = props;
    const edge = ensureContrast(accent, colors.bg, 3);
    return (
      <>
        <defs>
          <filter id={id("halo")} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id={id("text-glow")} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feComponentTransfer in="blur" result="soft">
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="soft" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={id("dot-glow")} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect {...outline(props)} fill={edge} opacity="0.35" filter={`url(#${id("halo")})`} />
        <rect {...outline(props, 1)} fill={colors.bg} stroke={edge} stroke-opacity="0.55" stroke-width="1" />
      </>
    );
  },
};
