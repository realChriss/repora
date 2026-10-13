import { DEFAULTS, FLAGS, LAYOUTS, SCALE, STYLE_HINTS, STYLE_NAMES, WIDTH } from "../shared/card-options";
import { MAX_ICON_BYTES } from "../shared/github";

const code = (values: readonly (string | number)[]) => values.map((value) => `\`${value}\``).join(" ");

export function llmsTxt(origin: string): string {
  const card = (path: string) => `${origin}/${path}`;
  return `# Repora

> Repora turns a public GitHub repository into an SVG card for a README. A card is a plain image URL, \`${origin}/<owner>/<repo>?<options>\`, rendered on request from the repository's live GitHub data. There is no API key, account, upload or build step: building the URL is the whole job.

## Create a card for a repository

1. Get the repository as \`owner/repo\`. In a local checkout, read it from \`git remote get-url origin\`. Only public GitHub repositories work.
2. Optionally pick an icon. Look in the repository for a logo or icon (png, jpg, gif, webp or svg, at most ${MAX_ICON_BYTES / 1024 / 1024} MB), for example \`assets/logo.png\` or \`docs/icon.svg\`, and pass its path relative to the repository root as \`icon\`. It is loaded from the default branch, so the file must be committed and pushed. Without an icon, or if it cannot be loaded, the card shows the repository's first letter.
3. Pick options from the table below. Leave out everything that should stay at its default; the shortest URL is the right one.
4. Check the URL by fetching it. It always answers \`200\` with \`image/svg+xml\`. A working card's \`<title>\` is \`owner/repo\` (or \`repo\` with \`show_owner=false\`). Anything else is an error card whose \`<title>\` names the problem, for example \`Repository not found\` or \`accent: must be a hex color like 4FB3FF\`.
5. Add the card to the README as an image that links to the repository:

\`\`\`md
[![owner/repo](${card("owner/repo")})](https://github.com/owner/repo)
\`\`\`

Or as HTML, for example to center it:

\`\`\`html
<p align="center"><a href="https://github.com/owner/repo"><img src="${card("owner/repo")}" alt="owner/repo" /></a></p>
\`\`\`

## Options

| Option | Values | Default |
|---|---|---|
| \`style\` | ${code(STYLE_NAMES)}, see Styles | \`${DEFAULTS.style}\` |
| \`layout\` | ${code(LAYOUTS)}; \`pill\` is a compact one-line badge | \`${DEFAULTS.layout}\` |
| \`accent\` | hex color | \`${DEFAULTS.accent.slice(1)}\` |
| \`bg\` \`fg\` \`muted\` | hex color for the background, text and muted text | the style's colors |
| \`width\` | whole number from ${WIDTH.min} to ${WIDTH.max}, card layout only | \`${DEFAULTS.width}\` |
| \`scale\` | number from ${SCALE.min} to ${SCALE.max}; multiplies the image size without changing the layout | \`${DEFAULTS.scale}\` |
| \`icon\` | path to an image inside the repository, see step 2 | first letter |
| ${code(FLAGS)} | \`true\` \`false\` \`1\` \`0\` | \`true\` |

- Write hex colors without \`#\`, as \`4FB3FF\` or \`4BF\`. A raw \`#\` in a URL starts the fragment, so the color would be lost.
- An invalid value does not fall back to the default: the URL renders an error card naming the option. Unknown options are ignored.
- \`icon\` must be a relative path inside the repository: no URLs, no \`.\` or \`..\` segments.

## Styles

${STYLE_NAMES.map((style) => `- \`${style}\`: ${STYLE_HINTS[style]}`).join("\n")}

## Examples

- ${card("oven-sh/bun")}
- ${card("oven-sh/bun?icon=docs/icons/bun.svg")}
- ${card("oven-sh/bun?style=glow&accent=B48CFF&layout=pill")}
- ${card("oven-sh/bun?style=bar&icon=docs/icons/bun.svg&show_forks=false")}
- ${card("oven-sh/bun?style=solid&accent=4ADE9B&show_owner=false&width=600")}

## Notes

- Cards are cached, so new stars or a changed description can take up to half an hour to show. Error cards are cached for a minute.
- ${origin}/ is an interactive builder for people, with a live preview. It produces the same URLs.
`;
}
