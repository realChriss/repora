import { beforeEach, expect, setSystemTime, test } from "bun:test";
import { clearCache, memo } from "./cache";

beforeEach(() => {
  clearCache();
  setSystemTime();
});

test("reuses the value until the ttl expires", async () => {
  let calls = 0;
  const load = async () => ++calls;

  setSystemTime(new Date(0));
  expect(await memo("k", 1000, load)).toBe(1);
  expect(await memo("k", 1000, load)).toBe(1);

  setSystemTime(new Date(1001));
  expect(await memo("k", 1000, load)).toBe(2);
});

test("shares one in-flight load between concurrent callers", async () => {
  let calls = 0;
  const load = async () => ++calls;
  const results = await Promise.all([memo("k", 1000, load), memo("k", 1000, load)]);
  expect(results).toEqual([1, 1]);
});

test("does not keep rejections unless an error ttl is given", async () => {
  let calls = 0;
  const fail = async () => {
    calls++;
    throw new Error("nope");
  };

  await expect(memo("a", 1000, fail)).rejects.toThrow();
  await expect(memo("a", 1000, fail)).rejects.toThrow();
  expect(calls).toBe(2);

  await expect(memo("b", 1000, fail, 1000)).rejects.toThrow();
  await expect(memo("b", 1000, fail, 1000)).rejects.toThrow();
  expect(calls).toBe(3);
});
