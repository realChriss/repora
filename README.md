<div align="center">
  <img src="assets/icon.png" width="80" height="80" alt="" />
  <h1>Repora</h1>
  <p>SVG cards for GitHub repositories, ready to embed in a README.</p>
  <p>
    <a href="https://github.com/realChriss/repora/actions/workflows/ci.yml"><img src="https://github.com/realChriss/repora/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
    <a href="https://github.com/realChriss/repora/tags"><img src="https://img.shields.io/github/v/tag/realChriss/repora?sort=semver&amp;label=release" alt="Latest release" /></a>
  </p>
  <p>
    <a href="https://repora.am1v.wtf"><strong>Create your card</strong></a> ·
    <a href="#usage">Usage</a> ·
    <a href="#options">Options</a> ·
    <a href="#self-hosting">Self-hosting</a> ·
    <a href="#development">Development</a>
  </p>
  <br />
  <a href="https://repora.am1v.wtf"><img src="assets/cards.webp" width="488" alt="repora cards for oven-sh/bun, cycling through styles, layouts and accent colors" /></a>
</div>

## Usage

The easiest way is the builder at [repora.am1v.wtf](https://repora.am1v.wtf): enter a repo, adjust the style with a live preview, and copy the Markdown, URL or HTML.

With an AI agent like Claude Code, just ask it to create a card for your repo using `https://repora.am1v.wtf/llms.txt`.

Or write the link yourself. Add the card as an image that links to the repo:

```md
[![realChriss/repora](https://repora.am1v.wtf/realChriss/repora)](https://github.com/realChriss/repora)
```

More examples:

```
/realChriss/repora?style=acrylic
/realChriss/repora?style=glow&accent=B48CFF&layout=pill
/realChriss/repora?style=bar&icon=assets/icon.png&show_forks=false
/realChriss/repora?style=solid&accent=4ADE9B&show_owner=false
```

## Options

`https://repora.am1v.wtf/<owner>/<repo>?<options>`

| Option | Values | Default |
|---|---|---|
| `style` | `acrylic` `rim` `tinted` `glow` `bar` `solid` | `rim` |
| `layout` | `card` `pill` | `card` |
| `accent` | hex color, `#` optional | `4FB3FF` |
| `bg` `fg` `muted` | hex color, overrides the style's palette | – |
| `width` | 300–800 (card only) | `460` |
| `scale` | 0.5–3, multiplies the image size without changing the layout | `1` |
| `icon` | path to a png/jpg/gif/webp/svg **inside the repo**, e.g. `assets/logo.png` | monogram |
| `show_icon` `show_owner` `show_description` `show_language` `show_stars` `show_forks` | `true` `false` `1` `0` | `true` |

## Self-hosting

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/realChriss/repora/main/docker-compose.prod.yml
nano docker-compose.yml   # paste your GITHUB_TOKEN
mkdir -m 777 logs   # request logs, must exist and be writable before the first start
docker compose up -d
```

| Variable | Description | Default |
|---|---|---|
| `GITHUB_TOKEN` | Optional. Raises GitHub's rate limit from 60 to 5000 requests per hour. A [fine-grained token](https://github.com/settings/personal-access-tokens/new) with read-only access to public repositories is enough. | – |
| `PORT` | Port the server listens on | `3000` |

Requests are logged to stdout and `logs/requests.log`.

## Development

```bash
bun install
GITHUB_TOKEN=github_pat_... bun dev
bun test
bun run typecheck
```

## License

[Apache 2.0](LICENSE)
