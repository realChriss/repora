# repora

SVG cards for a GitHub repository. You can embed them in a README.

```md
[![hono](https://your-host/honojs/hono?style=rim)](https://github.com/honojs/hono)
```

Open `/` for the URL builder: enter a repo, tweak the options with a live preview, and copy the Markdown, URL or HTML. The builder keeps its settings in the page URL, so a configured link can be shared.

## Run

```bash
bun install
GITHUB_TOKEN=ghp_... bun dev   # token optional: 60 req/h without, 5000 req/h with
bun test
bun run typecheck
```

`PORT` defaults to 3000.

## Options

`GET /:owner/:repo?<options>`

| Option | Values | Default |
|---|---|---|
| `style` | `acrylic` `rim` `tinted` `glow` `bar` `solid` | `rim` |
| `layout` | `card` `pill` | `card` |
| `accent` | hex color, `#` optional | `4FB3FF` |
| `bg` `fg` `muted` | hex color, overrides the style's palette | – |
| `width` | 300–800 (card only) | `460` |
| `icon` | path to a png/jpg/gif/webp/svg **inside the repo**, e.g. `assets/logo.png` | monogram |
| `title` | text that replaces `owner/repo` | – |
| `description` | text that replaces the GitHub description | – |
| `show_icon` `show_owner` `show_description` `show_language` `show_stars` `show_forks` | `true` `false` `1` `0` | `true` |

## Examples

```
/honojs/hono?style=acrylic
/honojs/hono?style=glow&accent=B48CFF&layout=pill
/honojs/hono?style=bar&icon=docs/images/hono-title.png&show_forks=false
/honojs/hono?style=solid&accent=4ADE9B&title=Hono&description=Fast%20web%20framework
```

## Caching

- GitHub repo data is cached in memory for 10 min and icons for 1 h. Failed lookups are cached for 1–10 min.
- Responses send `Cache-Control: max-age=1800, stale-while-revalidate=86400` and an ETag.
- Error cards are sent with status 200 and a 60 s cache, so GitHub's image proxy shows the message instead of a broken image.
