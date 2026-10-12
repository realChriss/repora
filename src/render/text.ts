export type Measure = (text: string) => number;

export const ELLIPSIS = "…";

export function truncate(text: string, maxWidth: number, measure: Measure): string {
  if (measure(text) <= maxWidth) return text;
  // Code points, not UTF-16 units, so an emoji is never cut in half.
  const chars = [...text];
  const withEllipsis = (end: number) => chars.slice(0, end).join("").trimEnd() + ELLIPSIS;
  let end = chars.length;
  while (end > 0 && measure(withEllipsis(end)) > maxWidth) end--;
  return withEllipsis(end);
}

/** Greedy word wrap. The last allowed line is truncated with an ellipsis when text remains. */
export function wrapLines(text: string, maxWidth: number, measure: Measure, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const [index, word] of words.entries()) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth || !current) {
      current = candidate;
      continue;
    }
    if (lines.length === maxLines - 1) {
      current = `${current} ${words.slice(index).join(" ")}`;
      break;
    }
    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.map((line) => truncate(line, maxWidth, measure));
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function formatCount(count: number): string {
  return compact.format(count).toLowerCase();
}

const RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LTR_CHAR = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/;

/** True when the first strongly directional character is right-to-left (Hebrew, Arabic, ...). */
export function isRtl(text: string): boolean {
  for (const char of text) {
    if (RTL_CHAR.test(char)) return true;
    if (LTR_CHAR.test(char)) return false;
  }
  return false;
}
