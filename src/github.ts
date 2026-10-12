import { memo } from "./cache";

const MINUTE = 60_000;
const MAX_ICON_BYTES = 1024 * 1024;

const ICON_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export class GitHubError extends Error {}

export interface Repo {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  defaultBranch: string;
}

interface RepoResponse {
  name: string;
  owner: { login: string };
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  default_branch: string;
}

export function getRepo(owner: string, repo: string): Promise<Repo> {
  const key = `repo:${owner}/${repo}`.toLowerCase();
  return memo(key, 10 * MINUTE, () => fetchRepo(owner, repo), MINUTE);
}

async function fetchRepo(owner: string, repo: string): Promise<Repo> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "repora",
  };
  const token = Bun.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (response.status === 404) throw new GitHubError("Repository not found");
  if (response.status === 403 || response.status === 429) throw new GitHubError("GitHub rate limit reached");
  if (!response.ok) throw new GitHubError(`GitHub responded with ${response.status}`);

  const data = (await response.json()) as RepoResponse;
  return {
    owner: data.owner.login,
    name: data.name,
    description: data.description,
    language: data.language,
    stars: data.stargazers_count,
    forks: data.forks_count,
    defaultBranch: data.default_branch,
  };
}

// Data URI because SVGs rendered via <img> cannot load external URLs.
export function getRepoIcon(repo: Repo, path: string): Promise<string> {
  const key = `icon:${repo.owner}/${repo.name}/${repo.defaultBranch}/${path}`;
  return memo(key, 60 * MINUTE, () => fetchIcon(repo, path), 10 * MINUTE);
}

async function fetchIcon(repo: Repo, path: string): Promise<string> {
  const type = ICON_TYPES[path.split(".").pop()!.toLowerCase()] ?? "application/octet-stream";
  const branch = repo.defaultBranch.split("/").map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${branch}/${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new GitHubError("Icon not found in repository");
  if (Number(response.headers.get("content-length") ?? 0) > MAX_ICON_BYTES) {
    throw new GitHubError("Icon is larger than 1 MB");
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_ICON_BYTES) throw new GitHubError("Icon is larger than 1 MB");
  return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
}
