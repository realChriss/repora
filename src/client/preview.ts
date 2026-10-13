import { useEffect, useState } from "hono/jsx";
import { GitHubError } from "../shared/github";
import { renderError } from "../shared/render";
import { addFont, FONT_WEIGHTS, fontFile, type Embed, type FontName } from "../shared/render/fonts";
import { styles } from "../shared/render/styles";
import { renderRepoCard } from "../shared/repo-card";
import type { Card } from "./form";

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

export type PreviewStatus = "empty" | "loading" | "updating" | "ready" | "error";

interface Preview {
  status: PreviewStatus;
  src?: string;
}

const DEBOUNCE_MS = 250;

export function usePreview(card: Card | undefined): Preview {
  const [preview, setPreview] = useState<Preview>({ status: "empty" });
  useEffect(() => {
    if (!card) return setPreview({ status: "empty" });
    let current = true;
    setPreview(({ src }) => ({ status: src ? "updating" : "loading", src }));
    const timer = setTimeout(async () => {
      try {
        const svg = await renderPreview(card);
        if (current) setPreview({ status: "ready", src: `data:image/svg+xml,${encodeURIComponent(svg)}` });
      } catch (error) {
        if (!current) return;
        console.error(error);
        setPreview({ status: "error" });
      }
    }, DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [card?.url]);
  return preview;
}
