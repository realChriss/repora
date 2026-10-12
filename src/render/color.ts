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
