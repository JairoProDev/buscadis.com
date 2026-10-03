/**
 * Reduce Vercel Image Optimization cache writes on high-cardinality listing grids.
 * Supabase (and most CDNs) already serve WebP/JPEG at reasonable size — avoid
 * re-transforming every unique adiso URL through /_next/image.
 */

const SUPABASE_HOST_SUFFIX = '.supabase.co';

export function isSupabaseStorageUrl(src: string): boolean {
  try {
    const u = new URL(src);
    return u.hostname.endsWith(SUPABASE_HOST_SUFFIX) && u.pathname.includes('/storage/v1/object/');
  } catch {
    return false;
  }
}

/** Use on feed/grid cards only; keep Next/Image optimization on detail/hero if needed. */
export function shouldBypassVercelImageOptimization(src: string | undefined | null): boolean {
  if (!src) return false;
  return isSupabaseStorageUrl(src);
}
