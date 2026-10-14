---
name: card-showcase
description: Regenerate assets/cards.webp, the animated showcase cycling through card styles. Use after adding or changing card styles, or when asked to refresh the animation.
---

# Card showcase

Run from the repo root (Git Bash):

```bash
bash .claude/skills/card-showcase/render.sh            # writes assets/cards.webp
bash .claude/skills/card-showcase/render.sh /tmp/x.webp # try it elsewhere first
```

It takes about 10 s. It needs `bun`, `ffmpeg` (with `libwebp_anim`) and Edge. To use Chrome instead, set `BROWSER=/path/to/chrome`.

## How it works

1. Starts the server on port 3123 and fetches each entry in `VARIANTS` as an SVG for `oven-sh/bun` at `scale=2`.
2. Screenshots each SVG with headless Edge (`--screenshot`, `--default-background-color=00000000` for transparency), with all variants running in parallel. A browser renders the embedded fonts, blur and filters exactly like GitHub does.
3. ffmpeg pads every PNG to the largest size and chains `xfade` transitions: an eased fade-out of the current card, then a fade-in of the next, so two cards never overlap. The first variant is repeated at the end so the loop is seamless. Frames are `premultiply`d before the fade and `unpremultiply`d after it. Without that, xfade blends transparent pixels as black, and half-transparent edges such as the glow halo show up as a thick dark border mid-fade. The result is encoded with `libwebp_anim`. libwebp merges identical hold frames, so a hold costs one frame.

## Tuning

- Change which cards appear by editing `VARIANTS` in `render.sh`. Include every style in `STYLE_NAMES`, a few pills, and a mix of accents.
- `HOLD`, `FADE` (seconds), `FPS` and `QUALITY` sit at the top of the script. Fade frames make up over 90% of the file, so `FPS` is the main size lever. 15 fps looked choppy. 30 fps at q80 came to 1.3 MB; 24 fps at q70 comes to 0.8 MB, and hold frames look no different. Rendering at `scale=1.5` would save about 30% more but makes text soft on retina screens.
- Keep `-compression_level 4`. Level 6 takes about 30 s to encode and only saves about 4%.
- The README shows the image at `width="488"`, which is half the 2x canvas. Update the README `alt` text if the content changes.

## Check the result

ffmpeg decodes animated WebP unreliably, so check it with Pillow (`Image.open(...).seek(n)`) or open it in a browser. Look for cut-off cards (window size), black backgrounds (transparency lost) and jumps at the loop point.
