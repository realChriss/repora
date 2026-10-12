import type { Child } from "hono/jsx";
import {
  chipHeight,
  IconBadge,
  MetaItemView,
  metaItems,
  metaItemWidth,
  textWidth,
  Title,
  type CardContent,
  type MetaStyle,
  type Theme,
} from "./parts";
import { isRtl, wrapLines } from "./text";

const GAP = 12;
const ICON_GAP = 12;
const MAX_DESCRIPTION_LINES = 3;

export interface Sized {
  width: number;
  height: number;
  node: Child;
}

export function layoutCard(content: CardContent, theme: Theme, width: number): Sized {
  const m = theme.style.card;
  const innerWidth = width - m.padding.x * 2;
  const left = m.padding.x;
  let y = m.padding.top;
  const rows: Child[] = [];

  const headerHeight = Math.max(content.icon ? m.iconSize : 0, m.titleSize * 1.3);
  const iconOffset = content.icon ? m.iconSize + ICON_GAP : 0;
  if (content.icon) {
    rows.push(
      <IconBadge
        icon={content.icon}
        x={left}
        y={y + (headerHeight - m.iconSize) / 2}
        size={m.iconSize}
        radius={m.iconRadius}
        theme={theme}
      />,
    );
  }
  rows.push(
    <Title
      content={content}
      theme={theme}
      x={left + iconOffset}
      y={y + headerHeight / 2}
      size={m.titleSize}
      maxWidth={innerWidth - iconOffset}
    />,
  );
  y += headerHeight;

  if (content.description) {
    const lineHeight = m.descriptionSize * m.descriptionLineHeight;
    const measure = (text: string) => textWidth(theme, text, m.descriptionSize);
    const lines = wrapLines(content.description, innerWidth, measure, MAX_DESCRIPTION_LINES);
    const rtl = isRtl(content.description);
    y += GAP;
    rows.push(
      <text font-size={m.descriptionSize} fill={theme.colors.description} text-anchor={rtl ? "end" : undefined}>
        {lines.map((line, i) => (
          <tspan x={rtl ? left + innerWidth : left} y={y + lineHeight * (i + 0.5)} dominant-baseline="central">
            {line}
          </tspan>
        ))}
      </text>,
    );
    y += lines.length * lineHeight;
  }

  const items = metaItems(content, theme.colors);
  if (items.length) {
    const meta: MetaStyle = { size: m.metaSize, weight: m.metaWeight, dotSize: m.dotSize, chip: theme.colors.chip };
    const rowHeight = meta.chip ? chipHeight(m.metaSize) : m.metaSize * 1.4;
    const center = y + GAP + rowHeight / 2;
    let x = left;
    for (const item of items) {
      rows.push(<MetaItemView item={item} meta={meta} theme={theme} x={x} y={center} />);
      x += metaItemWidth(item, meta, theme) + m.metaGap;
    }
    y += GAP + rowHeight;
  }

  return { width, height: Math.ceil(y + m.padding.bottom), node: <>{rows}</> };
}
