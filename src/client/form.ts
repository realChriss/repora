import { DEFAULTS, FLAGS, HEX_PATTERN, type Flag, type Layout, type StyleName } from "../shared/card-options";
import { cardQuery, repoParams, type CardQuery } from "../shared/options";
import { styles } from "../shared/render/styles";

export const COLOR_FIELDS = ["accent", "bg", "fg", "muted"] as const;
export type ColorField = (typeof COLOR_FIELDS)[number];

export type Format = "markdown" | "url" | "html";

export interface Form {
  repo: string;
  style: StyleName;
  layout: Layout;
  width: number;
  scale: number;
  accent: string;
  bg: string;
  fg: string;
  muted: string;
  icon: string;
  flags: Record<Flag, boolean>;
}

export const INITIAL_FORM: Form = {
  repo: "oven-sh/bun",
  style: DEFAULTS.style,
  layout: DEFAULTS.layout,
  width: DEFAULTS.width,
  scale: DEFAULTS.scale,
  accent: DEFAULTS.accent,
  bg: "",
  fg: "",
  muted: "",
  icon: "docs/icons/bun.svg",
  flags: Object.fromEntries(FLAGS.map((flag) => [flag, true])) as Record<Flag, boolean>,
};

export interface Card {
  owner: string;
  name: string;
  query: CardQuery;
  url: string;
}

export type Errors = Partial<Record<"repo" | ColorField | "icon", string>>;

export function normalizeHex(value: string): string {
  return (value.startsWith("#") ? value : `#${value}`).toUpperCase();
}

export function parseRepo(input: string) {
  const [owner, repo] = input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .replace(/(\.git)?\/?$/, "")
    .split("/");
  return repoParams.safeParse({ owner, repo }).data;
}

function cardParams(form: Form): URLSearchParams {
  const params = new URLSearchParams();
  if (form.style !== DEFAULTS.style) params.set("style", form.style);
  if (form.layout !== DEFAULTS.layout) params.set("layout", form.layout);
  for (const key of COLOR_FIELDS) {
    const raw = form[key].trim();
    if (!raw) continue;
    const hex = normalizeHex(raw);
    if (key !== "accent" || hex !== DEFAULTS.accent) params.set(key, hex.slice(1));
  }
  if (form.width !== DEFAULTS.width) params.set("width", String(form.width));
  if (form.scale !== DEFAULTS.scale) params.set("scale", String(form.scale));
  if (form.icon.trim()) params.set("icon", form.icon.trim());
  for (const flag of FLAGS) {
    if (!form.flags[flag]) params.set(flag, "false");
  }
  return params;
}

const sentence = (message: string) => `${message[0]!.toUpperCase()}${message.slice(1)}.`;

export function buildCard(form: Form, origin: string): { card?: Card; errors: Errors } {
  const errors: Errors = {};
  const params = cardParams(form);
  for (const issue of cardQuery.safeParse(Object.fromEntries(params)).error?.issues ?? []) {
    const key = String(issue.path[0]);
    errors[key as keyof Errors] ??= sentence(issue.message);
    params.delete(key);
  }
  const query = cardQuery.parse(Object.fromEntries(params));

  const repo = parseRepo(form.repo);
  if (!repo) {
    if (form.repo.trim()) errors.repo = "Enter it as owner/repo, like oven-sh/bun.";
    return { errors };
  }
  const search = params.toString().replaceAll("%2F", "/");
  const url = `${origin}/${repo.owner}/${repo.repo}${search ? `?${search}` : ""}`;
  return { card: { owner: repo.owner, name: repo.repo, query, url }, errors };
}

export function snippetFor(card: Card, format: Format): string {
  const repo = `${card.owner}/${card.name}`;
  const link = `https://github.com/${repo}`;
  if (format === "url") return card.url;
  if (format === "html") return `<a href="${link}"><img src="${card.url}" alt="${repo}" /></a>`;
  return `[![${repo}](${card.url})](${link})`;
}

export function effectiveColors(form: Form): Record<ColorField, string> {
  const valid = (value: string) => (HEX_PATTERN.test(value.trim()) ? normalizeHex(value.trim()) : undefined);
  const accent = valid(form.accent) ?? DEFAULTS.accent;
  const defaults = styles[form.style].colors(accent);
  return {
    accent,
    bg: valid(form.bg) ?? normalizeHex(defaults.bg),
    fg: valid(form.fg) ?? normalizeHex(defaults.title),
    muted: valid(form.muted) ?? normalizeHex(defaults.muted),
  };
}
