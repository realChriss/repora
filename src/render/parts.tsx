import { measure, type FontWeight } from "./fonts";
import { languageColor } from "./languages";
import type { Colors, Style } from "./styles/types";
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

export interface Theme {
  style: Style;
  colors: Colors;
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
  colors: Colors;
}

export function IconBadge({ icon, x, y, size, radius, colors }: IconProps) {
  if (icon.kind === "image") {
    return (
      <>
        <clipPath id="icon-clip">
          <rect x={x} y={y} width={size} height={size} rx={radius} />
        </clipPath>
        <image
          href={icon.href}
          x={x}
          y={y}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid slice"
          clip-path="url(#icon-clip)"
        />
      </>
    );
  }
  const stroke = colors.monogramStroke ? 1 : 0;
  return (
    <>
      <rect
        x={x + stroke / 2}
        y={y + stroke / 2}
        width={size - stroke}
        height={size - stroke}
        rx={radius}
        fill={colors.monogramBg}
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

/** Title as text runs, so styles can render the owner prefix in a muted color. */
export function titleRuns({ owner, name }: CardContent, theme: Theme) {
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
    <text x={x} y={y} dominant-baseline="central" font-size={size} {...theme.style.titleProps}>
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
  chip?: string;
}

const CHIP_PADDING_X = 10;
const ICON_GAP = 6;

const starSize = (size: number) => size * 0.95;

function contentWidth(item: MetaItem, meta: MetaStyle, theme: Theme): number {
  const text = textWidth(theme, item.text, meta.size, meta.weight);
  if (item.kind === "language") return meta.dotSize + ICON_GAP + text;
  if (item.kind === "stars") return starSize(meta.size) + 4 + text;
  return text;
}

export function metaItemWidth(item: MetaItem, meta: MetaStyle, theme: Theme): number {
  return contentWidth(item, meta, theme) + (meta.chip ? CHIP_PADDING_X * 2 : 0);
}

export function chipHeight(size: number): number {
  return size + 11;
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
  const textColor = meta.chip ? colors.fg : colors.muted;
  const width = metaItemWidth(item, meta, theme);
  const height = chipHeight(meta.size);
  let cursor = x + (meta.chip ? CHIP_PADDING_X : 0);

  const chip = meta.chip && (
    <rect x={x} y={y - height / 2} width={width} height={height} rx={height / 2} fill={meta.chip} />
  );

  let marker = null;
  let color = textColor;
  if (item.kind === "language") {
    marker = <circle cx={cursor + meta.dotSize / 2} cy={y} r={meta.dotSize / 2} fill={item.dot} {...style.dotProps} />;
    cursor += meta.dotSize + ICON_GAP;
  } else if (item.kind === "stars") {
    const size = starSize(meta.size);
    color = colors.star;
    marker = (
      <path d={STAR_PATH} fill={color} transform={`translate(${cursor} ${y - size / 2}) scale(${size / 16})`} />
    );
    cursor += size + 4;
  }

  return (
    <>
      {chip}
      {marker}
      <text x={cursor} y={y} dominant-baseline="central" font-size={meta.size} font-weight={meta.weight} fill={color}>
        {item.text}
      </text>
    </>
  );
}
