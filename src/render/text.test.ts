import { expect, test } from "bun:test";
import { formatCount, isRtl, wrapLines } from "./text";

const measure = (text: string) => text.length * 10;

test("wraps words to fit the width", () => {
  expect(wrapLines("aaa bbb ccc ddd", 70, measure, 3)).toEqual(["aaa bbb", "ccc ddd"]);
});

test("truncates the last line with an ellipsis when lines run out", () => {
  expect(wrapLines("aaa bbb ccc ddd eee", 70, measure, 2)).toEqual(["aaa bbb", "ccc dd…"]);
});

test("truncates a single word longer than the width", () => {
  expect(wrapLines("abcdefghijkl", 50, measure, 3)).toEqual(["abcd…"]);
});

test("formats counts compactly", () => {
  expect(formatCount(84)).toBe("84");
  expect(formatCount(1234)).toBe("1.2k");
  expect(formatCount(2_500_000)).toBe("2.5m");
});

test("detects right-to-left text from the first strong character", () => {
  expect(isRtl("שלום world")).toBe(true);
  expect(isRtl("2024 مرحبا")).toBe(true);
  expect(isRtl("hello שלום")).toBe(false);
});
