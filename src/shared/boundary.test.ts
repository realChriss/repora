import { expect, test } from "bun:test";

const RUNTIME_ONLY = /\bBun\.|\bprocess\.|from "(node|bun):|from "subset-font"|from "[./]+\/(server|client)\//;

test("shared code runs in both the server and the browser", async () => {
  const dir = Bun.fileURLToPath(new URL(".", import.meta.url));
  for await (const file of new Bun.Glob("**/*.{ts,tsx}").scan(dir)) {
    if (file.endsWith(".test.ts")) continue;
    const source = await Bun.file(`${dir}/${file}`).text();
    expect({ file, match: source.match(RUNTIME_ONLY)?.[0] }).toEqual({ file, match: undefined });
  }
});
