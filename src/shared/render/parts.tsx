import type { Child } from "hono/jsx";
import { measure, type FontWeight } from "./fonts";
import { languageColor } from "./languages";
import type { Colors, IdFor, Style } from "./styles/types";
import { formatCount, truncate } from "./text";

export type Icon = { kind: "image"; href: string } | { kind: "monogram"; letter: string };

export interface CardContent {
  owner?: string;
  name: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  icon?: Icon;
}

export interface Sized {
  width: number;
  height: number;
  node: Child;
}

export interface Theme {
  style: Style;
  colors: Colors;
  id: IdFor;
}

function filterUrl(theme: Theme, name: string | undefined) {
  return name ? { filter: `url(#${theme.id(name)})` } : {};
}

export function textWidth(theme: Theme, text: string, size: number, weight: FontWeight = 400): number {
  return measure(text, theme.style.font, weight, size);
}

interface IconProps {
  icon: Icon;
  x: number;
  y: number;
  size: number;
  radius: number;
  theme: Theme;
}

export function IconBadge({ icon, x, y, size, radius, theme }: IconProps) {
  const { colors, id } = theme;
  if (icon.kind === "image") {
    return (
      <>
        <clipPath id={id("icon-clip")}>
          <rect x={x} y={y} width={size} height={size} rx={radius} />
        </clipPath>
        <image
          href={icon.href}
          x={x}
          y={y}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid slice"
          clip-path={`url(#${id("icon-clip")})`}
        />
      </>
    );
  }
  const stroke = colors.monogramStroke ? 1 : 0;
  const gradient = colors.monogramGradient;
  return (
    <>
      {gradient && (
        <linearGradient id={id("monogram")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color={gradient[0]} />
          <stop offset="1" stop-color={gradient[1]} />
        </linearGradient>
      )}
      <rect
        x={x + stroke / 2}
        y={y + stroke / 2}
        width={size - stroke}
        height={size - stroke}
        rx={radius}
        fill={gradient ? `url(#${id("monogram")})` : colors.monogramBg}
        stroke={colors.monogramStroke}
        stroke-width={stroke || undefined}
      />
      <text
        x={x + size / 2}
        y={y + size / 2}
        text-anchor="middle"
        dominant-baseline="central"
        font-size={Math.round(size * 0.47)}
        font-weight="600"
        fill={colors.monogramFg}
      >
        {icon.letter}
      </text>
    </>
  );
}

interface TitleProps {
  content: CardContent;
  theme: Theme;
  x: number;
  y: number;
  size: number;
  maxWidth: number;
}

function titleRuns({ owner, name }: CardContent, theme: Theme) {
  const { colors, style } = theme;
  if (!owner) return [{ text: name, color: colors.title, weight: 600 as const }];
  if (!style.splitOwner) return [{ text: `${owner}/${name}`, color: colors.title, weight: 600 as const }];
  return [
    { text: `${owner} / `, color: colors.muted, weight: 400 as const },
    { text: name, color: colors.title, weight: 600 as const },
  ];
}

export function titleWidth(content: CardContent, theme: Theme, size: number): number {
  return titleRuns(content, theme).reduce((sum, run) => sum + textWidth(theme, run.text, size, run.weight), 0);
}

export function Title({ content, theme, x, y, size, maxWidth }: TitleProps) {
  let remaining = maxWidth;
  const runs = titleRuns(content, theme).map((run) => {
    const text = truncate(run.text, remaining, (t) => textWidth(theme, t, size, run.weight));
    remaining -= textWidth(theme, text, size, run.weight);
    return { ...run, text };
  });
  return (
    <text x={x} y={y} dominant-baseline="central" font-size={size} {...filterUrl(theme, theme.style.titleFilter)}>
      {runs.map((run) => (
        <tspan fill={run.color} font-weight={run.weight}>
          {run.text}
        </tspan>
      ))}
    </text>
  );
}

type MetaItem =
  | { kind: "language"; text: string; dot: string }
  | { kind: "stars"; text: string }
  | { kind: "forks"; text: string };

export function metaItems(content: CardContent, colors: Colors): MetaItem[] {
  const items: MetaItem[] = [];
  if (content.language) {
    items.push({ kind: "language", text: content.language, dot: colors.dot ?? languageColor(content.language) });
  }
  if (content.stars !== undefined) items.push({ kind: "stars", text: formatCount(content.stars) });
  if (content.forks !== undefined) items.push({ kind: "forks", text: `${formatCount(content.forks)} forks` });
  return items;
}

export interface MetaStyle {
  size: number;
  weight: FontWeight;
  dotSize: number;
}

const ICON_GAP = 6;
const STAR_GAP = 4;

const starSize = (size: number) => size * 0.95;

export function metaItemWidth(item: MetaItem, meta: MetaStyle, theme: Theme): number {
  const text = textWidth(theme, item.text, meta.size, meta.weight);
  if (item.kind === "language") return meta.dotSize + ICON_GAP + text;
  if (item.kind === "stars") return starSize(meta.size) + STAR_GAP + text;
  return text;
}

// Octicons star-fill-16, MIT
const STAR_PATH =
  "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z";

interface MetaItemProps {
  item: MetaItem;
  meta: MetaStyle;
  theme: Theme;
  x: number;
  y: number;
}

export function MetaItemView({ item, meta, theme, x, y }: MetaItemProps) {
  const { colors, style } = theme;
  let cursor = x;

  let marker = null;
  let color = colors.muted;
  if (item.kind === "language") {
    marker = <circle cx={cursor + meta.dotSize / 2} cy={y} r={meta.dotSize / 2} fill={item.dot} {...filterUrl(theme, style.dotFilter)} />;
    cursor += meta.dotSize + ICON_GAP;
  } else if (item.kind === "stars") {
    const size = starSize(meta.size);
    color = colors.star;
    marker = (
      <path d={STAR_PATH} fill={color} transform={`translate(${cursor} ${y - size / 2}) scale(${size / 16})`} />
    );
    cursor += size + STAR_GAP;
  }

  return (
    <>
      {marker}
      <text x={cursor} y={y} dominant-baseline="central" font-size={meta.size} font-weight={meta.weight} fill={color}>
        {item.text}
      </text>
    </>
  );
}
