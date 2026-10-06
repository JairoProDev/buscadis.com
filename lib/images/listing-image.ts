/**
 * Listing grid images: bypass Vercel Image Optimization (cache writes) and use
 * Supabase Storage image transforms for consistent quality + smaller bytes on mobile.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */

import type { Adiso } from '@/types';
import { adisoUsesGeneratedCover } from '@/lib/flyer/templates';

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

/** Aviso de empleo con flyer/foto subida (p. ej. diseño vertical), no portada OG generada. */
export function adisoShowsPortraitJobFlyer(
  adiso: Pick<Adiso, 'categoria' | 'imagenUrl' | 'imagenesUrls' | 'privateData'>,
): boolean {
  if (adiso.categoria !== 'empleos') return false;
  const priv = adiso.privateData as Record<string, unknown> | undefined;
  if (priv?.source === 'catalog_product') return false;
  const url = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
  if (!url) return false;
  if (adisoUsesGeneratedCover(adiso)) return false;
  return true;
}

/** Miniatura lista (cuadrado fijo): rellenar el marco. */
export function listingCardListThumbImageClass(): string {
  return 'object-cover object-center';
}

/**
 * Feed/grid con foto: escala al 100% del ancho (sin recorte lateral).
 * El contenedor cuadrado recorta solo el exceso inferior.
 */
export function listingCardGridPhotoClass(): string {
  return 'block h-auto w-full max-w-full';
}

export function listingCardMediaAspectClass(
  vista: 'list' | 'grid' | 'feed',
  isCatalogProduct: boolean,
  _portraitJobFlyer: boolean,
): string {
  if (vista === 'list') {
    return isCatalogProduct
      ? 'h-[112px] w-[112px] shrink-0'
      : 'h-24 w-24 shrink-0 md:h-24 md:w-24';
  }
  return 'aspect-square w-full';
}

/** Grid cards: never route through /_next/image (Vercel quota). */
export function shouldBypassVercelImageOptimization(src: string | undefined | null): boolean {
  if (!src) return false;
  return isSupabaseStorageUrl(src);
}
