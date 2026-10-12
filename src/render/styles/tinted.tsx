import { ensureContrast, mix } from "../color";
import { outline } from "./shape";
import type { Style } from "./types";

const BASE = "#0e1014";

export const tinted: Style = {
  font: "plex",
  colors: (accent) => {
    const bg = mix(accent, BASE, 0.16);
    const chip = mix(accent, BASE, 0.22);
    const monogramBg = mix(accent, BASE, 0.3);
    return {
      bg,
      fg: "#eef0f2",
      title: "#eef0f2",
      muted: "#b7bcc4",
      description: ensureContrast(mix(accent, "#b7bcc4", 0.25), bg),
      star: ensureContrast(accent, chip),
      monogramBg,
      monogramFg: ensureContrast(accent, monogramBg),
      chip,
    };
  },
  card: {
    padding: { top: 20, x: 22, bottom: 20 },
    iconSize: 30,
    iconRadius: 9,
    titleSize: 17,
    descriptionSize: 13.5,
    descriptionLineHeight: 1.5,
    metaSize: 12.5,
    metaGap: 8,
    metaWeight: 400,
    dotSize: 8,
  },
  pill: { padding: 7, iconSize: 28, fontSize: 13.5 },
  cardRadius: 16,
  Frame: (props) => <rect {...outline(props)} fill={props.colors.bg} />,
};
