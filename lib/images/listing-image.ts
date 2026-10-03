/**
 * Listing grid images: bypass Vercel Image Optimization (cache writes) and use
 * Supabase Storage image transforms for consistent quality + smaller bytes on mobile.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */

const SUPABASE_HOST_SUFFIX = '.supabase.co';

/** Width for feed cards (2-col mobile ~50vw). Detail/modal should use original URL. */
export const LISTING_CARD_IMAGE_WIDTH = 512;

export function isSupabaseStorageUrl(src: string): boolean {
  try {
    const u = new URL(src);
    return u.hostname.endsWith(SUPABASE_HOST_SUFFIX) && u.pathname.includes('/storage/v1/');
  } catch {
    return false;
  }
}

/**
 * Supabase render endpoint: WebP/JPEG at target width (quality 80).
 * Non-Supabase URLs unchanged (may still use Next/Image on detail pages).
 */
export function getListingThumbnailUrl(
  src: string | undefined | null,
  width: number = LISTING_CARD_IMAGE_WIDTH
): string | undefined {
  if (!src) return undefined;
  if (!isSupabaseStorageUrl(src)) return src;

  try {
    const u = new URL(src);
    if (u.pathname.includes('/render/image/')) {
      u.searchParams.set('width', String(width));
      u.searchParams.set('quality', '80');
      return u.toString();
    }
    if (!u.pathname.includes('/object/public/')) return src;

    u.pathname = u.pathname.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/'
    );
    u.search = new URLSearchParams({
      width: String(width),
      quality: '80',
    }).toString();
    return u.toString();
  } catch {
    return src;
  }
}

/** Grid cards: never route through /_next/image (Vercel quota). */
export function shouldBypassVercelImageOptimization(src: string | undefined | null): boolean {
  if (!src) return false;
  return isSupabaseStorageUrl(src);
}
