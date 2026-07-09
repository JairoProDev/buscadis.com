/** Append cache-bust query param so CDNs/PWA refetch after profile media updates. */
export function withMediaCacheBust(
  url: string | null | undefined,
  version?: string | number | null
): string {
  if (!url?.trim()) return '';
  if (version == null || version === '') return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(String(version))}`;
}
