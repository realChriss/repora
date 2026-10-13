import { getRepo, getRepoIcon, type GitHubOptions, type Repo } from "./github";
import type { CardQuery } from "./options";
import { renderSvg, type CardContent } from "./render";
import type { Embed } from "./render/fonts";
import type { Icon } from "./render/parts";

export interface RenderEnv {
  embed: Embed;
  github?: GitHubOptions;
}

export async function renderRepoCard(owner: string, name: string, query: CardQuery, env: RenderEnv): Promise<string> {
  const repo = await getRepo(owner, name, env.github);
  const icon = query.show_icon ? await resolveIcon(repo, query.icon) : undefined;
  return renderSvg(toContent(repo, query, icon), query, env.embed);
}

async function resolveIcon(repo: Repo, path: string | undefined): Promise<Icon> {
  const monogram: Icon = { kind: "monogram", letter: repo.name.charAt(0).toUpperCase() };
  if (!path) return monogram;
  try {
    return { kind: "image", href: await getRepoIcon(repo, path) };
  } catch {
    return monogram;
  }
}

function toContent(repo: Repo, query: CardQuery, icon: Icon | undefined): CardContent {
  return {
    owner: query.show_owner ? repo.owner : undefined,
    name: repo.name,
    description: query.show_description && repo.description ? repo.description : undefined,
    language: query.show_language && repo.language ? repo.language : undefined,
    stars: query.show_stars ? repo.stars : undefined,
    forks: query.show_forks ? repo.forks : undefined,
    icon,
  };
}
