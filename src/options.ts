import { z } from "zod";
import { DEFAULTS, HEX_PATTERN, LAYOUTS, STYLE_NAMES, WIDTH } from "./card-options";

const hexColor = z
  .string()
  .regex(HEX_PATTERN, "must be a hex color like 4FB3FF")
  .transform((value) => (value.startsWith("#") ? value : `#${value}`));

const flag = z
  .enum(["true", "false", "1", "0"])
  .default("true")
  .transform((value) => value === "true" || value === "1");

/** Relative path to an image in the repo; no `..` segments, absolute paths or URLs. */
const repoPath = z
  .string()
  .max(256)
  .regex(/^[\w\-.]+(\/[\w\-.]+)*$/, "must be a relative path inside the repo")
  .refine((path) => !path.split("/").some((segment) => segment === ".." || segment === "."), {
    message: "must not contain . or .. segments",
  })
  .refine((path) => /\.(png|jpe?g|gif|webp|svg)$/i.test(path), { message: "must be a png, jpg, gif, webp or svg" });

export const cardQuery = z.object({
  style: z.enum(STYLE_NAMES).default(DEFAULTS.style),
  layout: z.enum(LAYOUTS).default(DEFAULTS.layout),
  accent: hexColor.default(DEFAULTS.accent),
  bg: hexColor.optional(),
  fg: hexColor.optional(),
  muted: hexColor.optional(),
  width: z.coerce.number().int().min(WIDTH.min).max(WIDTH.max).default(DEFAULTS.width),
  icon: repoPath.optional(),
  title: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  show_icon: flag,
  show_owner: flag,
  show_description: flag,
  show_language: flag,
  show_stars: flag,
  show_forks: flag,
});

export type CardQuery = z.infer<typeof cardQuery>;

export const repoParams = z.object({
  owner: z.string().regex(/^[\w.-]{1,100}$/, "invalid owner"),
  repo: z.string().regex(/^[\w.-]{1,100}$/, "invalid repo"),
});
