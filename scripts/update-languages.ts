const SOURCE = "https://raw.githubusercontent.com/github-linguist/linguist/main/lib/linguist/languages.yml";

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Download failed: ${response.status}`);

const languages = Bun.YAML.parse(await response.text()) as Record<string, { color?: string }>;
const colors = Object.fromEntries(
  Object.entries(languages)
    .filter(([, language]) => language.color)
    .map(([name, language]) => [name, language.color!.toLowerCase()]),
);

await Bun.write(new URL("../src/shared/render/languages.json", import.meta.url), `${JSON.stringify(colors, null, 2)}\n`);
console.log(`Wrote ${Object.keys(colors).length} language colors`);
