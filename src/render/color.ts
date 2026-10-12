type Rgb = [number, number, number];

function parseHex(hex: string): Rgb {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

function toHex(rgb: Rgb): string {
  return "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

/** `amount` of `a` mixed into `b`, like CSS `color-mix(a amount%, b)`. */
export function mix(a: string, b: string, amount: number): string {
  const [ca, cb] = [parseHex(a), parseHex(b)];
  return toHex(ca.map((c, i) => c * amount + cb[i]! * (1 - amount)) as Rgb);
}

function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const DARK_INK = "#0b0c0e";
const LIGHT_INK = "#f5f7fa";

/** Dark or light text, whichever reads better on `bg`. */
export function readableInk(bg: string): string {
  return contrast(DARK_INK, bg) >= contrast(LIGHT_INK, bg) ? DARK_INK : LIGHT_INK;
}

/** `fg` unchanged when it already reaches `min` contrast on `bg`, otherwise shifted toward the readable ink. */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
  const ink = readableInk(bg);
  for (let step = 0; step <= 10; step++) {
    const candidate = mix(ink, fg, step / 10);
    if (contrast(candidate, bg) >= min) return candidate;
  }
  return ink;
}
