import "vanilla-colorful/hex-color-picker.js";
import { DEFAULTS, FLAGS, HEX_PATTERN, type StyleName } from "../shared/card-options";
import { GitHubError } from "../shared/github";
import { cardQuery, repoParams, type CardQuery } from "../shared/options";
import { renderError } from "../shared/render";
import { addFont, FONT_WEIGHTS, fontFile, type Embed, type FontName } from "../shared/render/fonts";
import { styles } from "../shared/render/styles";
import { renderRepoCard } from "../shared/repo-card";

type Format = "markdown" | "url" | "html";

const form = document.querySelector<HTMLFormElement>("#builder")!;
const preview = document.querySelector<HTMLElement>("#preview")!;
const previewImage = document.querySelector<HTMLImageElement>("#preview-image")!;
const previewMessage = document.querySelector<HTMLElement>("#preview-message")!;
const snippet = document.querySelector<HTMLTextAreaElement>("#snippet")!;
const copyButton = document.querySelector<HTMLButtonElement>("#copy")!;
const widthGroup = document.querySelector<HTMLFieldSetElement>("#width-group")!;
const widthValue = document.querySelector<HTMLOutputElement>("#width-value")!;
const scaleValue = document.querySelector<HTMLOutputElement>("#scale-value")!;

const field = <T extends HTMLElement = HTMLInputElement>(name: string) =>
  form.elements.namedItem(name) as unknown as T;

const HEX_FIELDS = ["accent", "bg", "fg", "muted"] as const;

interface Card {
  owner: string;
  name: string;
  query: CardQuery;
  url: string;
}

function parseRepo(input: string) {
  const [owner, repo] = input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .replace(/(\.git)?\/?$/, "")
    .split("/");
  return repoParams.safeParse({ owner, repo }).data;
}

function setError(name: string, message: string) {
  const error = document.getElementById(`${name}-error`);
  if (error) error.textContent = message;
  field(name).toggleAttribute("aria-invalid", Boolean(message));
}

function normalizeHex(value: string): string {
  return (value.startsWith("#") ? value : `#${value}`).toUpperCase();
}

function cardParams(): URLSearchParams {
  const data = new FormData(form);
  const params = new URLSearchParams();

  for (const key of ["style", "layout"] as const) {
    const value = String(data.get(key) ?? "");
    if (value && value !== DEFAULTS[key]) params.set(key, value);
  }

  for (const key of HEX_FIELDS) {
    const raw = String(data.get(key) ?? "").trim();
    if (!raw) continue;
    const hex = normalizeHex(raw);
    if (key !== "accent" || hex !== DEFAULTS.accent) params.set(key, hex.slice(1));
  }

  for (const key of ["width", "scale"] as const) {
    const value = data.get(key);
    if (value && Number(value) !== DEFAULTS[key]) params.set(key, String(value));
  }

  const icon = String(data.get("icon") ?? "").trim();
  if (icon) params.set("icon", icon);

  for (const flag of FLAGS) {
    if (!data.has(flag)) params.set(flag, "false");
  }
  return params;
}

const ERROR_FIELDS = [...HEX_FIELDS, "icon"] as const;

function validQuery(params: URLSearchParams): CardQuery {
  const { error } = cardQuery.safeParse(Object.fromEntries(params));
  for (const key of ERROR_FIELDS) {
    const message = error?.issues.find((issue) => issue.path[0] === key)?.message;
    setError(key, message ? `${message[0]!.toUpperCase()}${message.slice(1)}.` : "");
    if (message) params.delete(key);
  }
  return cardQuery.parse(Object.fromEntries(params));
}

function buildCard(): Card | null {
  const repo = parseRepo(field("repo").value);
  const empty = !field("repo").value.trim();
  setError("repo", repo || empty ? "" : "Enter it as owner/repo, like honojs/hono.");
  const params = cardParams();
  const query = validQuery(params);
  if (!repo) return null;

  const url = `${location.origin}/${repo.owner}/${repo.repo}${params.size ? `?${params}` : ""}`;
  return { owner: repo.owner, name: repo.repo, query, url };
}

function snippetFor(card: Card, format: Format): string {
  const repo = `${card.owner}/${card.name}`;
  const link = `https://github.com/${repo}`;
  if (format === "url") return card.url;
  if (format === "html") return `<a href="${link}"><img src="${card.url}" alt="${repo}" /></a>`;
  return `[![${repo}](${card.url})](${link})`;
}

const fontBytes = new Map<string, Uint8Array>();
const fontLoads = new Map<FontName, Promise<unknown>>();

function loadFont(name: FontName): Promise<unknown> {
  let load = fontLoads.get(name);
  if (!load) {
    load = Promise.all(
      FONT_WEIGHTS.map(async (weight) => {
        const file = fontFile(name, weight);
        const response = await fetch(`/assets/fonts/${file}`);
        if (!response.ok) throw new Error(`${file}: ${response.status}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        fontBytes.set(file, bytes);
        addFont(name, weight, bytes);
      }),
    );
    load.catch(() => fontLoads.delete(name));
    fontLoads.set(name, load);
  }
  return load;
}

const embedFull: Embed = async (name, weight) => fontBytes.get(fontFile(name, weight))!.toBase64();

async function renderPreview(card: Card): Promise<string> {
  await Promise.all([loadFont("inter"), loadFont(styles[card.query.style].font)]);
  try {
    return await renderRepoCard(card.owner, card.name, card.query, { embed: embedFull });
  } catch (error) {
    if (error instanceof GitHubError) return renderError(error.message);
    throw error;
  }
}

let latestUrl = "";
let previewSrc = "";

async function showPreview(card: Card | null) {
  if (!card) {
    latestUrl = "";
    preview.dataset.state = "empty";
    previewImage.hidden = true;
    previewMessage.textContent = "Enter a repository like honojs/hono to see its card.";
    return;
  }
  if (card.url === latestUrl) return;
  latestUrl = card.url;
  preview.dataset.state = previewImage.hidden ? "loading" : "updating";

  try {
    const svg = await renderPreview(card);
    if (card.url !== latestUrl) return;
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    previewSrc = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    previewImage.src = previewSrc;
    previewImage.alt = `Card for ${card.owner}/${card.name}`;
    previewImage.hidden = false;
    preview.dataset.state = "ready";
  } catch (error) {
    if (card.url !== latestUrl) return;
    console.error(error);
    previewImage.hidden = true;
    preview.dataset.state = "error";
    previewMessage.textContent = "The preview could not be loaded. Check your connection and try again.";
  }
}

function selectedFormat(): Format {
  return (document.querySelector<HTMLInputElement>('input[name="format"]:checked')?.value ?? "markdown") as Format;
}

function syncOutputs() {
  widthValue.textContent = `${field("width").value}px`;
  scaleValue.textContent = `${field("scale").value}×`;
}

type HexField = (typeof HEX_FIELDS)[number];

function styleDefaults(): Record<HexField, string> {
  const accent = field("accent").value.trim();
  const style = styles[field<RadioNodeList & HTMLElement>("style").value as StyleName];
  const colors = style.colors(HEX_PATTERN.test(accent) ? normalizeHex(accent) : DEFAULTS.accent);
  return { accent: DEFAULTS.accent, bg: colors.bg, fg: colors.fg, muted: colors.muted };
}

function currentColor(key: HexField, defaults = styleDefaults()): string {
  const raw = field(key).value.trim();
  return normalizeHex(HEX_PATTERN.test(raw) ? raw : defaults[key]);
}

function syncColors() {
  const defaults = styleDefaults();
  for (const key of HEX_FIELDS) {
    const swatch = document.getElementById(`${key}-swatch`)!;
    swatch.style.setProperty("--swatch", currentColor(key, defaults));
    swatch.toggleAttribute("data-default", !field(key).value.trim());
    if (key !== "accent") field(key).placeholder = normalizeHex(defaults[key]);
  }
}

function placePopover(popover: HTMLElement, anchor: HTMLElement) {
  const gap = 8;
  const box = anchor.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = popover;
  const below = box.bottom + gap + height <= innerHeight || box.top - gap - height < 0;
  popover.style.top = `${scrollY + (below ? box.bottom + gap : box.top - gap - height)}px`;
  popover.style.left = `${scrollX + Math.max(gap, Math.min(box.left, innerWidth - width - gap))}px`;
}

for (const key of HEX_FIELDS) {
  const popover = document.getElementById(`${key}-popover`)!;
  const picker = popover.querySelector("hex-color-picker")!;
  popover.addEventListener("toggle", (event) => {
    if ((event as ToggleEvent).newState !== "open") return popover.removeAttribute("data-placed");
    picker.color = currentColor(key).toLowerCase();
    placePopover(popover, document.getElementById(`${key}-swatch`)!);
    popover.setAttribute("data-placed", "");
  });
  picker.addEventListener("color-changed", (event) => {
    field(key).value = (event as CustomEvent<{ value: string }>).detail.value.toUpperCase();
    syncColors();
    clearTimeout(updateTimer);
    updateTimer = setTimeout(update, 150);
  });
  popover.querySelector("[data-reset]")?.addEventListener("click", () => {
    field(key).value = "";
    popover.hidePopover();
    update();
  });
}

function update() {
  syncColors();
  const isPill = field<RadioNodeList & HTMLElement>("layout").value === "pill";
  widthGroup.disabled = isPill;
  syncOutputs();

  const card = buildCard();
  showPreview(card);
  snippet.value = card ? snippetFor(card, selectedFormat()) : "";
  copyButton.disabled = !card;
}

let updateTimer: ReturnType<typeof setTimeout> | undefined;

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.type === "range") syncOutputs();
  syncColors();

  clearTimeout(updateTimer);
  updateTimer = setTimeout(update, inputDelay(target));
}

form.addEventListener("input", onInput);
field("repo").addEventListener("input", onInput);

function inputDelay(target: HTMLInputElement): number {
  if (target.tagName === "TEXTAREA" || target.type === "text") return 350;
  if (target.type === "range") return 150;
  return 0;
}

form.addEventListener("click", (event) => {
  const preset = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-accent]");
  if (!preset) return;
  field("accent").value = preset.dataset.accent!;
  update();
});

document.querySelectorAll<HTMLInputElement>('input[name="canvas"]').forEach((input) =>
  input.addEventListener("change", () => (preview.dataset.canvas = input.value)),
);

document.querySelectorAll<HTMLInputElement>('input[name="format"]').forEach((input) =>
  input.addEventListener("change", update),
);

let copyTimer: ReturnType<typeof setTimeout> | undefined;

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(snippet.value);
    copyButton.textContent = "Copied";
  } catch {
    snippet.select();
    copyButton.textContent = "Press Ctrl+C";
  }
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copyButton.textContent = "Copy"), 1600);
});

update();
