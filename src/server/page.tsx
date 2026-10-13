import type { Child } from "hono/jsx";
import { DEFAULTS, FLAGS, SCALE, STYLE_NAMES, WIDTH, type Flag, type StyleName } from "../shared/card-options";

const STYLE_HINTS: Record<StyleName, string> = {
  acrylic: "Smoked glass with a sheen",
  rim: "Dark glass, lit edge",
  tinted: "Accent-washed fill",
  glow: "Dark with a neon edge",
  bar: "Light with an accent bar",
  solid: "Full accent color",
};

const FLAG_LABELS: Record<Flag, string> = {
  show_icon: "Icon",
  show_owner: "Owner",
  show_description: "Description",
  show_language: "Language",
  show_stars: "Stars",
  show_forks: "Forks",
};

const ACCENT_PRESETS = ["#4FB3FF", "#B48CFF", "#4ADE9B", "#FF8A5B"];

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  children: Child;
}

function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div class="field">
      <label for={id}>{label}</label>
      {children}
      {hint && (
        <p class="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <p class="error" id={`${id}-error`} role="alert" />
    </div>
  );
}

interface SegmentedProps {
  name: string;
  legend: string;
  options: readonly { value: string; label: string }[];
  checked: string;
  form?: string;
}

function Segmented({ name, legend, options, checked, form }: SegmentedProps) {
  return (
    <fieldset class="segmented">
      <legend>{legend}</legend>
      <div class="segmented-track">
        {options.map((option) => (
          <label>
            <input type="radio" name={name} value={option.value} checked={option.value === checked} form={form} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ColorField({ id, label }: { id: "bg" | "fg" | "muted"; label: string }) {
  return (
    <Field id={id} label={label}>
      <input id={id} name={id} class="mono" autocomplete="off" spellcheck={false} aria-describedby={`${id}-error`} />
    </Field>
  );
}

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
            <Field id="repo" label="Repository" hint="owner/repo, or paste a GitHub link">
              <input
                id="repo"
                name="repo"
                form="builder"
                class="mono"
                value="honojs/hono"
                spellcheck={false}
                aria-describedby="repo-hint repo-error"
              />
            </Field>
          </header>

          <form id="builder" class="controls" autocomplete="off" onsubmit="return false">
            <fieldset class="styles">
              <legend>Style</legend>
              <div class="style-grid">
                {STYLE_NAMES.map((style) => (
                  <label class="style-option">
                    <input type="radio" name="style" value={style} checked={style === DEFAULTS.style} />
                    <span class="style-name">{style}</span>
                    <span class="style-hint">{STYLE_HINTS[style]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div class="row">
              <Segmented
                name="layout"
                legend="Layout"
                checked={DEFAULTS.layout}
                options={[
                  { value: "card", label: "Card" },
                  { value: "pill", label: "Pill" },
                ]}
              />
              <fieldset id="width-group" class="range">
                <legend>
                  Width <output id="width-value">{DEFAULTS.width}px</output>
                </legend>
                <input
                  type="range"
                  name="width"
                  min={WIDTH.min}
                  max={WIDTH.max}
                  step="10"
                  value={DEFAULTS.width}
                  aria-label="Card width in pixels"
                />
              </fieldset>
            </div>

            <fieldset class="range">
              <legend>
                Scale <output id="scale-value">{DEFAULTS.scale}×</output>
              </legend>
              <input
                type="range"
                name="scale"
                min={SCALE.min}
                max={SCALE.max}
                step="0.05"
                value={DEFAULTS.scale}
                aria-label="Image scale"
              />
            </fieldset>

            <fieldset class="accent">
              <legend>Accent</legend>
              <div class="accent-row">
                <input type="color" id="accent-picker" value={DEFAULTS.accent.toLowerCase()} aria-label="Pick accent color" />
                <input
                  id="accent"
                  name="accent"
                  class="mono"
                  value={DEFAULTS.accent}
                  spellcheck={false}
                  aria-label="Accent hex color"
                  aria-describedby="accent-error"
                />
                <div class="presets">
                  {ACCENT_PRESETS.map((color) => (
                    <button
                      type="button"
                      class="preset"
                      data-accent={color}
                      style={`--swatch:${color}`}
                      aria-label={`Use ${color}`}
                    />
                  ))}
                </div>
              </div>
              <p class="error" id="accent-error" role="alert" />
            </fieldset>

            <fieldset class="flags">
              <legend>Show</legend>
              <div class="flag-grid">
                {FLAGS.map((flag) => (
                  <label class="check">
                    <input type="checkbox" name={flag} checked />
                    <span>{FLAG_LABELS[flag]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field id="icon" label="Icon" hint="Path to an image in the same repo, like assets/logo.png">
              <input id="icon" name="icon" class="mono" spellcheck={false} aria-describedby="icon-hint icon-error" />
            </Field>

            <details class="more">
              <summary>Custom colors</summary>
              <div class="more-body">
                <div class="color-grid">
                  <ColorField id="bg" label="Background" />
                  <ColorField id="fg" label="Text" />
                  <ColorField id="muted" label="Muted text" />
                </div>
              </div>
            </details>
          </form>

          <section class="output" aria-label="Preview and link">
            <div class="preview-bar">
              <Segmented
                name="canvas"
                legend="Preview on"
                checked="dark"
                options={[
                  { value: "dark", label: "Dark" },
                  { value: "light", label: "Light" },
                ]}
              />
            </div>
            <div id="preview" class="preview" data-canvas="dark" data-state="empty" aria-live="polite">
              <img id="preview-image" alt="" hidden />
              <p class="preview-message" id="preview-message">
                Enter a repository like honojs/hono to see its card.
              </p>
            </div>

            <div class="snippet">
              <div class="snippet-bar">
                <Segmented
                  name="format"
                  legend="Copy as"
                  checked="markdown"
                  options={[
                    { value: "markdown", label: "Markdown" },
                    { value: "url", label: "URL" },
                    { value: "html", label: "HTML" },
                  ]}
                />
                <button type="button" id="copy" class="copy">
                  Copy
                </button>
              </div>
              <textarea id="snippet" class="mono" rows={3} readonly aria-label="Generated snippet" />
            </div>
          </section>
        </main>
        <noscript>
          <p class="noscript">The builder needs JavaScript. Cards work without it: use /owner/repo?style=rim as an image URL.</p>
        </noscript>
      </body>
    </html>
  );
}
