interface Entry<T> {
  expiresAt: number;
  value: Promise<T>;
  lastGood?: T;
}

const MAX_ENTRIES = 1000;
const entries = new Map<string, Entry<unknown>>();

export function memo<T>(
  key: string,
  ttlMs: number,
  load: (stale: T | undefined) => Promise<T>,
  errorTtlMs = 0,
): Promise<T> {
  const hit = entries.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const entry: Entry<T> = { expiresAt: Infinity, value: load(hit?.lastGood) };
  store(key, entry);

  entry.value.then(
    (value) => {
      entry.expiresAt = Date.now() + ttlMs;
      entry.lastGood = value;
    },
    () => (entry.expiresAt = Date.now() + errorTtlMs),
  );
  return entry.value;
}

export function isFresh(key: string): boolean {
  return (entries.get(key)?.expiresAt ?? 0) > Date.now();
}

export function clearCache() {
  entries.clear();
}

function store(key: string, entry: Entry<unknown>) {
  entries.delete(key);
  if (entries.size >= MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }
  entries.set(key, entry);
}
