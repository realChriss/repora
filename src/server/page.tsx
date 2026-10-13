const TITLE = "Repora: GitHub repo cards";
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
            <p class="wordmark">repora</p>
            <h1>Repo cards for your README</h1>
            <p class="lede">Pick a repository, tune the style, and copy the image link.</p>
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
