import { STYLE_NAMES } from "./render/styles";

const CSS = `
:root { color-scheme: light dark; --bg: #f6f6f4; --fg: #1c1c1a; --muted: #5a5a56; --panel: #ffffff; --line: #dcdcd8; }
@media (prefers-color-scheme: dark) { :root { --bg: #0d1117; --fg: #e6e9ee; --muted: #98a0ab; --panel: #161b22; --line: #30363d; } }
body { margin: 0; background: var(--bg); color: var(--fg); font-family: system-ui, sans-serif; }
main { max-width: 1040px; margin: 0 auto; padding: 48px 16px; display: grid; gap: 32px; }
form { display: flex; gap: 8px; flex-wrap: wrap; }
input { padding: 8px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--panel); color: inherit; font: inherit; }
button { padding: 8px 14px; border: 0; border-radius: 6px; background: var(--fg); color: var(--bg); font: inherit; cursor: pointer; }
section { display: grid; gap: 12px; padding: 20px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); }
h2 { margin: 0; font-size: 16px; }
img { max-width: 100%; height: auto; }
code { display: block; overflow-x: auto; padding: 8px 10px; border-radius: 6px; background: var(--bg); color: var(--muted); font-size: 12px; white-space: nowrap; }
`;

export function gallery(origin: string, repo: string) {
  const valid = /^[\w.-]+\/[\w.-]+$/.test(repo);
  const cardUrl = (style: string, layout: string) => `${origin}/${repo}?style=${style}&layout=${layout}`;

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>repora</title>
        <style>{CSS}</style>
      </head>
      <body>
        <main>
          <header>
            <h1>repora</h1>
            <p>
              Repo cards for your README. Use <code style="display:inline">/owner/repo?style=…</code> as an image URL.
            </p>
          </header>
          <form method="get">
            <input name="repo" value={repo} placeholder="owner/repo" aria-label="Repository" />
            <button type="submit">Preview</button>
          </form>
          {valid ? (
            STYLE_NAMES.map((style) => (
              <section>
                <h2>{style}</h2>
                <img src={cardUrl(style, "card")} alt={`${repo} card, ${style} style`} />
                <img src={cardUrl(style, "pill")} alt={`${repo} pill, ${style} style`} />
                <code>{`[![${repo}](${cardUrl(style, "card")})](https://github.com/${repo})`}</code>
              </section>
            ))
          ) : (
            <p>Enter a repository as owner/repo.</p>
          )}
        </main>
      </body>
    </html>
  );
}
