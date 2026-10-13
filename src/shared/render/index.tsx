import type { Child } from "hono/jsx";
import type { Layout, StyleName } from "../card-options";
import { layoutCard } from "./card";
import { fontFaceCss, fontStack, measure, type Embed } from "./fonts";
import type { CardContent, Sized, Theme } from "./parts";
import { layoutPill } from "./pill";
import { ELLIPSIS, wrapLines } from "./text";
import { styles } from "./styles";

export type { CardContent } from "./parts";

export interface Appearance {
  style: StyleName;
  layout: Layout;
  accent: string;
  width: number;
  scale: number;
  bg?: string;
  fg?: string;
  muted?: string;
}

function themeFor({ style: name, accent, bg, fg, muted }: Appearance, idPrefix: string): Theme {
  const style = styles[name];
  const colors = { ...style.colors(accent) };
  if (bg) colors.bg = bg;
  if (fg) colors.fg = colors.title = fg;
  if (muted) colors.muted = colors.description = colors.star = muted;
  return { style, colors, id: (name) => `${idPrefix}-${name}` };
}

// Every fixed text a card draws must be listed, or the subset font lacks its glyphs.
const COMMON_GLYPHS = `0123456789.kmbt forks/ ${ELLIPSIS}`;

function glyphsOf(content: CardContent): string {
  const letter = content.icon?.kind === "monogram" ? content.icon.letter : "";
  return [content.owner, content.name, content.description, content.language, letter, COMMON_GLYPHS].join("");
}

function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

export async function renderSvg(content: CardContent, appearance: Appearance, embed: Embed): Promise<string> {
  const idPrefix = `c${hash(JSON.stringify([content, appearance]))}`;
  const theme = themeFor(appearance, idPrefix);
  const { style } = theme;
  const { layout, accent } = appearance;
  const sized = layout === "card" ? layoutCard(content, theme, appearance.width) : layoutPill(content, theme);
  const radius = layout === "card" ? style.cardRadius : (style.pillRadius ?? sized.height / 2);
  const frame = (
    <style.Frame
      id={theme.id}
      layout={layout}
      width={sized.width}
      height={sized.height}
      radius={radius}
      colors={theme.colors}
      accent={accent}
    />
  );
  const label = content.owner ? `${content.owner}/${content.name}` : content.name;
  const css = await fontFaceCss(style.font, glyphsOf(content), embed);
  return svgDocument(sized, style.margin ?? 0, fontStack(style.font), css, label, [frame, sized.node], appearance.scale);
}

export function renderError(message: string): string {
  const width = 460;
  const padding = 22;
  const fontSize = 14;
  const lineHeight = fontSize * 1.5;
  const lines = wrapLines(message, width - padding * 2, (text) => measure(text, "inter", 400, fontSize), 3);
  const height = Math.ceil(lines.length * lineHeight + padding * 2);
  const node = (
    <>
      <rect x="0.5" y="0.5" width={width - 1} height={height - 1} rx="10" fill="#0d1117" stroke="#f85149" />
      <text font-size={fontSize} fill="#f0f3f6">
        {lines.map((line, i) => (
          <tspan x={padding} y={padding + lineHeight * (i + 0.5)} dominant-baseline="central">
            {line}
          </tspan>
        ))}
      </text>
    </>
  );
  return svgDocument({ width, height, node }, 0, fontStack("inter"), "", message, [node]);
}

function svgDocument(
  sized: Sized,
  margin: number,
  fontFamily: string,
  css: string,
  label: string,
  children: Child[],
  scale = 1,
) {
  const width = sized.width + margin * 2;
  const height = sized.height + margin * 2;
  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={Math.round(width * scale)}
      height={Math.round(height * scale)}
      viewBox={`0 0 ${width} ${height}`}
      font-family={fontFamily}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      {css && <style>{css}</style>}
      <g transform={`translate(${margin} ${margin})`}>{children}</g>
    </svg>
  );
  return svg.toString();
}
