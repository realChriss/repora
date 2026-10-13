import { memo } from "./cache";

const MINUTE = 60_000;
export const MAX_ICON_BYTES = 1024 * 1024;
const TIMEOUT_MS = 10_000;

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

export interface GitHubOptions {
  token?: string;
  beforeFetch?: (owner: string, repo: string) => Promise<void>;
}

export function getRepo(owner: string, repo: string, options: GitHubOptions = {}): Promise<Repo> {
  const key = `repo:${owner}/${repo}`.toLowerCase();
  return memo(key, 10 * MINUTE, () => fetchRepo(owner, repo, options), MINUTE);
}

async function fetchRepo(owner: string, repo: string, { token, beforeFetch }: GitHubOptions): Promise<Repo> {
  await beforeFetch?.(owner, repo);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "repora",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => {
    throw new GitHubError("GitHub is not responding");
  });
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
  return memo(key, 10 * MINUTE, () => fetchIcon(repo, path), 10 * MINUTE);
}

async function fetchIcon(repo: Repo, path: string): Promise<string> {
  const type = ICON_TYPES[path.split(".").pop()!.toLowerCase()] ?? "application/octet-stream";
  const branch = repo.defaultBranch.split("/").map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${branch}/${path}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new GitHubError("Icon not found in repository");
  return `data:${type};base64,${(await readCapped(response, MAX_ICON_BYTES)).toBase64()}`;
}

// Counts while streaming: Content-Length can be missing or be the compressed size.
async function readCapped(response: Response, limit: number): Promise<Uint8Array> {
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  const reader = response.body?.getReader();
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new GitHubError("Icon is larger than 1 MB");
    }
    chunks.push(value);
  }
  return new Uint8Array(await new Blob(chunks).arrayBuffer());
}
