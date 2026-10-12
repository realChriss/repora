import { z } from "zod";
import { DEFAULTS, HEX_PATTERN, LAYOUTS, STYLE_NAMES, WIDTH } from "./card-options";

const hexColor = z
  .string()
  .regex(HEX_PATTERN, "must be a hex color like 4FB3FF")
  .transform((value) => (value.startsWith("#") ? value : `#${value}`));

const flag = z
  .enum(["true", "false", "1", "0"], "must be true or false")
  .default("true")
  .transform((value) => value === "true" || value === "1");

/** Relative path to an image in the repo; no `..` segments, absolute paths or URLs. */
const widthMessage = `must be a whole number from ${WIDTH.min} to ${WIDTH.max}`;

const repoPath = z
  .string()
  .max(256, "must be at most 256 characters")
  .regex(/^[\w\-.]+(\/[\w\-.]+)*$/, "must be a relative path inside the repo")
  .refine((path) => !path.split("/").some((segment) => segment === ".." || segment === "."), {
    message: "must not contain . or .. segments",
  })
  .refine((path) => /\.(png|jpe?g|gif|webp|svg)$/i.test(path), { message: "must be a png, jpg, gif, webp or svg" });

export const cardQuery = z.object({
  style: z.enum(STYLE_NAMES, `must be one of ${STYLE_NAMES.join(", ")}`).default(DEFAULTS.style),
  layout: z.enum(LAYOUTS, "must be card or pill").default(DEFAULTS.layout),
  accent: hexColor.default(DEFAULTS.accent),
  bg: hexColor.optional(),
  fg: hexColor.optional(),
  muted: hexColor.optional(),
  width: z.coerce
    .number(widthMessage)
    .int(widthMessage)
    .min(WIDTH.min, widthMessage)
    .max(WIDTH.max, widthMessage)
    .default(DEFAULTS.width),
  icon: repoPath.optional(),
  title: z.string().max(100, "must be at most 100 characters").optional(),
  description: z.string().max(300, "must be at most 300 characters").optional(),
  show_icon: flag,
  show_owner: flag,
  show_description: flag,
  show_language: flag,
  show_stars: flag,
  show_forks: flag,
});

export type CardQuery = z.infer<typeof cardQuery>;

export const repoParams = z.object({
  owner: z.string().regex(/^[\w.-]{1,100}$/, "is not a valid GitHub owner"),
  repo: z.string().regex(/^[\w.-]{1,100}$/, "is not a valid repository name"),
});
