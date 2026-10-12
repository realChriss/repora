import { DEFAULTS, FLAGS, HEX_PATTERN, REPO_PATTERN } from "../card-options";

type Format = "markdown" | "url" | "html";

const form = document.querySelector<HTMLFormElement>("#builder")!;
const preview = document.querySelector<HTMLElement>("#preview")!;
const previewImage = document.querySelector<HTMLImageElement>("#preview-image")!;
const previewMessage = document.querySelector<HTMLElement>("#preview-message")!;
const snippet = document.querySelector<HTMLTextAreaElement>("#snippet")!;
const copyButton = document.querySelector<HTMLButtonElement>("#copy")!;
const widthGroup = document.querySelector<HTMLFieldSetElement>("#width-group")!;
const widthValue = document.querySelector<HTMLOutputElement>("#width-value")!;
const accentPicker = document.querySelector<HTMLInputElement>("#accent-picker")!;

const field = <T extends HTMLElement = HTMLInputElement>(name: string) =>
  form.elements.namedItem(name) as unknown as T;

const HEX_FIELDS = ["accent", "bg", "fg", "muted"] as const;
const TEXT_FIELDS = ["icon", "title", "description"] as const;

interface Card {
  repo: string;
  params: URLSearchParams;
  url: string;
}

function parseRepo(input: string): string | null {
  const value = input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .replace(/(\.git)?\/?$/, "")
    .split("/")
    .slice(0, 2)
    .join("/");
  return REPO_PATTERN.test(value) ? value : null;
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
    const valid = !raw || HEX_PATTERN.test(raw);
    setError(key, valid ? "" : "Use a hex color like 4FB3FF.");
    if (!raw || !valid) continue;
    const hex = normalizeHex(raw);
    if (key !== "accent" || hex !== DEFAULTS.accent) params.set(key, hex.slice(1));
  }

  const width = data.get("width");
  if (width && Number(width) !== DEFAULTS.width) params.set("width", String(width));

  for (const key of TEXT_FIELDS) {
    const value = String(data.get(key) ?? "").trim();
    if (value) params.set(key, value);
  }

  for (const flag of FLAGS) {
    if (!data.has(flag)) params.set(flag, "false");
  }
  return params;
}

function buildCard(): Card | null {
  const repo = parseRepo(field("repo").value);
  const empty = !field("repo").value.trim();
  setError("repo", repo || empty ? "" : "Enter it as owner/repo, like honojs/hono.");
  if (!repo) return null;

  const params = cardParams();
  return { repo, params, url: `${location.origin}/${repo}${params.size ? `?${params}` : ""}` };
}

function snippetFor(card: Card, format: Format): string {
  const link = `https://github.com/${card.repo}`;
  if (format === "url") return card.url;
  if (format === "html") return `<a href="${link}"><img src="${card.url}" alt="${card.repo}" /></a>`;
  return `[![${card.repo}](${card.url})](${link})`;
}

let latestUrl = "";

function showPreview(card: Card | null) {
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

  const next = new Image();
  next.onload = () => {
    if (card.url !== latestUrl) return;
    previewImage.src = card.url;
    previewImage.alt = `Card for ${card.repo}`;
    previewImage.hidden = false;
    preview.dataset.state = "ready";
  };
  next.onerror = () => {
    if (card.url !== latestUrl) return;
    previewImage.hidden = true;
    preview.dataset.state = "error";
    previewMessage.textContent = "The preview could not be loaded. Check your connection and try again.";
  };
  next.src = card.url;
}

function selectedFormat(): Format {
  return (document.querySelector<HTMLInputElement>('input[name="format"]:checked')?.value ?? "markdown") as Format;
}

function update() {
  const isPill = field<RadioNodeList & HTMLElement>("layout").value === "pill";
  widthGroup.disabled = isPill;
  widthValue.textContent = `${field("width").value}px`;

  const card = buildCard();
  showPreview(card);
  snippet.value = card ? snippetFor(card, selectedFormat()) : "";
  copyButton.disabled = !card;

  const pageQuery = card ? new URLSearchParams([["repo", card.repo], ...card.params]) : new URLSearchParams();
  history.replaceState(null, "", pageQuery.size ? `?${pageQuery}` : location.pathname);
}

function restore(params: URLSearchParams) {
  for (const [key, value] of params) {
    const control = form.elements.namedItem(key);
    if (control instanceof RadioNodeList) control.value = value;
    else if (control instanceof HTMLInputElement && control.type === "checkbox") control.checked = value !== "false";
    else if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
      control.value = HEX_FIELDS.includes(key as (typeof HEX_FIELDS)[number]) ? `#${value}` : value;
    }
  }
  const hasMoreOptions = ["bg", "fg", "muted", "title", "description"].some((key) => params.has(key));
  if (hasMoreOptions) form.querySelector("details")?.setAttribute("open", "");
  syncPicker();
}

function syncPicker() {
  const hex = field("accent").value.trim();
  if (/^#?[0-9a-f]{6}$/i.test(hex)) accentPicker.value = normalizeHex(hex).toLowerCase();
}

let updateTimer: ReturnType<typeof setTimeout> | undefined;

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target === accentPicker) field("accent").value = accentPicker.value.toUpperCase();
  if (target.name === "accent") syncPicker();
  if (target.name === "width") widthValue.textContent = `${target.value}px`;

  clearTimeout(updateTimer);
  updateTimer = setTimeout(update, inputDelay(target));
}

form.addEventListener("input", onInput);
field("repo").addEventListener("input", onInput);

function inputDelay(target: HTMLInputElement): number {
  if (target.tagName === "TEXTAREA" || target.type === "text") return 350;
  if (target.type === "range" || target.type === "color") return 150;
  return 0;
}

form.addEventListener("click", (event) => {
  const preset = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-accent]");
  if (!preset) return;
  field("accent").value = preset.dataset.accent!;
  syncPicker();
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

restore(new URLSearchParams(location.search));
update();
