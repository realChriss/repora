export const STYLE_NAMES = ["acrylic", "rim", "tinted", "glow", "bar", "solid"] as const;
export type StyleName = (typeof STYLE_NAMES)[number];

export const LAYOUTS = ["card", "pill"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const FLAGS = ["show_icon", "show_owner", "show_description", "show_language", "show_stars", "show_forks"] as const;
export type Flag = (typeof FLAGS)[number];

export const WIDTH = { min: 300, max: 800 } as const;
export const SCALE = { min: 0.5, max: 3 } as const;

export const DEFAULTS = {
  style: "rim",
  layout: "card",
  accent: "#4FB3FF",
  width: 460,
  scale: 1,
} as const;

export const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
