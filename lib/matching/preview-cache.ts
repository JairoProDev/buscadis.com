const cache = new Map<string, { data: unknown; expires: number }>();
const TTL_MS = 60_000;

export function getPreviewCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setPreviewCache(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + TTL_MS });
}

export function previewCacheKey(parts: Record<string, string>): string {
  return Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('|');
}
