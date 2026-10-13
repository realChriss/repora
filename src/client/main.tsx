import { useEffect, useRef, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import { FLAGS, SCALE, STYLE_NAMES, WIDTH, type Flag, type StyleName } from "../shared/card-options";
import { ColorInput, Field, Segmented } from "./components";
import { buildCard, effectiveColors, INITIAL_FORM, snippetFor, type Form, type Format } from "./form";
import { usePreview, type PreviewStatus } from "./preview";

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

const CUSTOM_COLORS = [
  { id: "bg", label: "Background" },
  { id: "fg", label: "Text" },
  { id: "muted", label: "Muted text" },
] as const;

const PREVIEW_MESSAGES: Partial<Record<PreviewStatus, string>> = {
  empty: "Enter a repository like honojs/hono to see its card.",
  error: "The preview could not be loaded. Check your connection and try again.",
};

const inputValue = (event: Event) => (event.target as HTMLInputElement).value;

function App() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [canvas, setCanvas] = useState<"dark" | "light">("dark");
  const [format, setFormat] = useState<Format>("markdown");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const snippetRef = useRef<HTMLTextAreaElement>(null);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm((previous) => ({ ...previous, [key]: value }));
  const setFlag = (flag: Flag, on: boolean) =>
    setForm((previous) => ({ ...previous, flags: { ...previous.flags, [flag]: on } }));

  const { card, errors } = buildCard(form, location.origin);
  const colors = effectiveColors(form);
  const preview = usePreview(card);
  const snippet = card ? snippetFor(card, format) : "";

  useEffect(() => {
    if (copyLabel === "Copy") return;
    const timer = setTimeout(() => setCopyLabel("Copy"), 1600);
    return () => clearTimeout(timer);
  }, [copyLabel]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopyLabel("Copied");
    } catch {
      snippetRef.current?.select();
      setCopyLabel("Press Ctrl+C");
    }
  };

  return (
    <>
      <Field id="repo" label="Repository" hint="owner/repo, or paste a GitHub link" error={errors.repo} class="repo">
        <input
          id="repo"
          class="mono"
          value={form.repo}
          aria-invalid={errors.repo ? "true" : undefined}
          aria-describedby="repo-hint repo-error"
          onInput={(event: Event) => set("repo")(inputValue(event))}
        />
      </Field>

      <form class="controls" autocomplete="off" onSubmit={(event: Event) => event.preventDefault()}>
        <fieldset class="styles">
          <legend>Style</legend>
          <div class="style-grid">
            {STYLE_NAMES.map((style) => (
              <label class="style-option">
                <input
                  type="radio"
                  name="style"
                  value={style}
                  checked={form.style === style}
                  onChange={() => set("style")(style)}
                />
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
            value={form.layout}
            onChange={set("layout")}
            options={[
              { value: "card", label: "Card" },
              { value: "pill", label: "Pill" },
            ]}
          />
          <fieldset class="range" disabled={form.layout === "pill"}>
            <legend>
              Width <output>{form.width}px</output>
            </legend>
            <input
              type="range"
              name="width"
              min={WIDTH.min}
              max={WIDTH.max}
              step="10"
              value={form.width}
              aria-label="Card width in pixels"
              onInput={(event: Event) => set("width")(Number(inputValue(event)))}
            />
          </fieldset>
        </div>

        <fieldset class="range">
          <legend>
            Scale <output>{form.scale}×</output>
          </legend>
          <input
            type="range"
            name="scale"
            min={SCALE.min}
            max={SCALE.max}
            step="0.05"
            value={form.scale}
            aria-label="Image scale"
            onInput={(event: Event) => set("scale")(Number(inputValue(event)))}
          />
        </fieldset>

        <fieldset class="accent">
          <legend>Accent</legend>
          <div class="accent-row">
            <ColorInput
              id="accent"
              label="Accent"
              inputLabel="Accent hex color"
              value={form.accent}
              color={colors.accent}
              invalid={Boolean(errors.accent)}
              onChange={set("accent")}
            />
            <div class="presets">
              {ACCENT_PRESETS.map((color) => (
                <button
                  type="button"
                  class="preset"
                  style={`--swatch:${color}`}
                  aria-label={`Use ${color}`}
                  onClick={() => set("accent")(color)}
                />
              ))}
            </div>
          </div>
          <p class="error" id="accent-error" role="alert">
            {errors.accent}
          </p>
        </fieldset>

        <fieldset class="flags">
          <legend>Show</legend>
          <div class="flag-grid">
            {FLAGS.map((flag) => (
              <label class="check">
                <input
                  type="checkbox"
                  name={flag}
                  checked={form.flags[flag]}
                  onChange={(event: Event) => setFlag(flag, (event.target as HTMLInputElement).checked)}
                />
                <span>{FLAG_LABELS[flag]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="icon" label="Icon" hint="Path to an image in the same repo, like assets/logo.png" error={errors.icon}>
          <input
            id="icon"
            class="mono"
            value={form.icon}
            aria-invalid={errors.icon ? "true" : undefined}
            aria-describedby="icon-hint icon-error"
            onInput={(event: Event) => set("icon")(inputValue(event))}
          />
        </Field>

        <details class="more">
          <summary>Custom colors</summary>
          <div class="more-body">
            <div class="color-grid">
              {CUSTOM_COLORS.map(({ id, label }) => (
                <Field id={id} label={label} error={errors[id]}>
                  <ColorInput
                    id={id}
                    label={label}
                    value={form[id]}
                    color={colors[id]}
                    invalid={Boolean(errors[id])}
                    optional
                    onChange={set(id)}
                  />
                </Field>
              ))}
            </div>
          </div>
        </details>
      </form>

      <section class="output" aria-label="Preview and link">
        <div class="preview-bar">
          <Segmented
            name="canvas"
            legend="Preview on"
            value={canvas}
            onChange={setCanvas}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </div>
        <div id="preview" class="preview" data-canvas={canvas} data-state={preview.status} aria-live="polite">
          {preview.src && <img id="preview-image" src={preview.src} alt={card ? `Card for ${card.owner}/${card.name}` : ""} />}
          <p class="preview-message">{PREVIEW_MESSAGES[preview.status]}</p>
        </div>

        <div class="snippet">
          <div class="snippet-bar">
            <Segmented
              name="format"
              legend="Copy as"
              value={format}
              onChange={setFormat}
              options={[
                { value: "markdown", label: "Markdown" },
                { value: "url", label: "URL" },
                { value: "html", label: "HTML" },
              ]}
            />
            <button type="button" class="copy" disabled={!card} onClick={copy}>
              {copyLabel}
            </button>
          </div>
          <textarea ref={snippetRef} id="snippet" class="mono" rows={3} readonly aria-label="Generated snippet" value={snippet} />
        </div>
      </section>
    </>
  );
}

render(<App />, document.getElementById("app")!);
