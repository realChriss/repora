import LANGUAGE_COLORS from "./languages.json";

const colors = new Map<string, string>(Object.entries(LANGUAGE_COLORS));

export function languageColor(language: string): string {
  return colors.get(language) ?? "#8b949e";
}
