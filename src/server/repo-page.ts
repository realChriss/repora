import { RepoNotFoundError } from "../shared/github";

const TIMEOUT_MS = 10_000;

// The repo page is not counted against the API quota, so unknown names cost no API call.
// Fails open: only a definite 404 stops the API call.
export async function assertRepoPage(owner: string, repo: string): Promise<void> {
  const response = await fetch(`https://github.com/${owner}/${repo}`, {
    method: "HEAD",
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => undefined);
  if (response?.status === 404) throw new RepoNotFoundError();
}
