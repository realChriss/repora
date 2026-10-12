export type Measure = (text: string) => number;

const ELLIPSIS = "…";

export function truncate(text: string, maxWidth: number, measure: Measure): string {
  if (measure(text) <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && measure(text.slice(0, end).trimEnd() + ELLIPSIS) > maxWidth) end--;
  return text.slice(0, end).trimEnd() + ELLIPSIS;
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
