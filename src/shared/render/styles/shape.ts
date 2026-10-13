import type { FrameProps } from "./types";

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
