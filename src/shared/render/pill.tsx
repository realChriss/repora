import type { Child } from "hono/jsx";
import {
  IconBadge,
  MetaItemView,
  metaItems,
  metaItemWidth,
  Title,
  titleWidth,
  type CardContent,
  type MetaStyle,
  type Sized,
  type Theme,
} from "./parts";

const GAP = 12;
const PADDING_RIGHT = 16;
const MAX_TITLE_WIDTH = 360;

export function layoutPill(content: CardContent, theme: Theme): Sized {
  const p = theme.style.pill;
  const height = Math.max(content.icon ? p.iconSize : 0, p.fontSize * 1.4) + p.padding * 2;
  const center = height / 2;
  const meta: MetaStyle = { size: p.fontSize, weight: 400, dotSize: 8 };
  const nodes: Child[] = [];
  let x = (p.leftInset ?? 0) + (content.icon ? p.padding : PADDING_RIGHT);

  if (content.icon) {
    nodes.push(
      <IconBadge
        icon={content.icon}
        x={x}
        y={center - p.iconSize / 2}
        size={p.iconSize}
        radius={p.iconSize / 2}
        theme={theme}
      />,
    );
    x += p.iconSize + GAP;
  }

  const title = Math.min(titleWidth(content, theme, p.fontSize), MAX_TITLE_WIDTH);
  nodes.push(<Title content={content} theme={theme} x={x} y={center} size={p.fontSize} maxWidth={title} />);
  x += title;

  for (const item of metaItems(content, theme.colors)) {
    x += GAP;
    nodes.push(<MetaItemView item={item} meta={meta} theme={theme} x={x} y={center} />);
    x += metaItemWidth(item, meta, theme);
  }

  return { width: Math.ceil(x + PADDING_RIGHT), height: Math.ceil(height), node: <>{nodes}</> };
}
