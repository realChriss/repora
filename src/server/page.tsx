const TITLE = "Repora: GitHub repo cards";
const SOURCE = "https://github.com/realChriss/repora";

// Octicons mark-github-16, MIT
const GITHUB_MARK =
  "M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z";
const DESCRIPTION =
  "Create SVG cards for GitHub repositories and embed them in your README.";

export function builderPage(version: string, origin: string) {
  const icon = `${origin}/icon.png`;
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="theme-color" content="#f3f4f6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0d12" media="(prefers-color-scheme: dark)" />
        <link rel="canonical" href={`${origin}/`} />
        <link rel="alternate" type="text/markdown" href="/llms.txt" title="Instructions for AI agents" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="repora" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={`${origin}/`} />
        <meta property="og:image" content={icon} />
        <meta property="og:image:alt" content="repora icon" />
        <meta name="twitter:card" content="summary" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preload" href="/assets/fonts/plex-400.woff2" as="font" type="font/woff2" crossorigin="" />
        <link rel="stylesheet" href={`/assets/builder.css?v=${version}`} />
        <script type="module" src={`/assets/builder.js?v=${version}`} />
      </head>
      <body>
        <main class="layout">
          <header class="intro">
            <div class="topline">
              <p class="wordmark">repora</p>
              <a class="source" href={SOURCE}>
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                  <path d={GITHUB_MARK} fill="currentColor" />
                </svg>
                GitHub
              </a>
            </div>
            <h1>Repo cards for your README</h1>
            <p class="lede">Pick a repository, tune the style, and copy the image link.</p>
            <p class="agent-hint">
              Using an AI agent? Have it read <a href="/llms.txt">{origin}/llms.txt</a>.
            </p>
          </header>
          <div id="app" class="app" spellcheck={false} />
        </main>
        <noscript>
          <p class="noscript">The builder needs JavaScript. Cards work without it: use /owner/repo?style=rim as an image URL.</p>
        </noscript>
      </body>
    </html>
  );
}
