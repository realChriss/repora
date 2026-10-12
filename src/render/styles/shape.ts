import type { FrameProps } from "./types";

/** Rect attributes for the frame outline, inset so a stroke of `strokeWidth` stays inside the bounds. */
export function outline({ width, height, radius }: FrameProps, strokeWidth = 0) {
  const inset = strokeWidth / 2;
  return {
    x: inset,
    y: inset,
    width: width - strokeWidth,
    height: height - strokeWidth,
    rx: Math.max(radius - inset, 0),
  };
}
