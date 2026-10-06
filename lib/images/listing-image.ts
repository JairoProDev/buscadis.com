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

/** Original public object URL (no Supabase render — evita recorte cover por `?width=`). */
export function supabaseStorageObjectPublicUrl(src: string): string {
  try {
    const u = new URL(src);
    u.pathname = u.pathname.replace(
      '/storage/v1/render/image/public/',
      '/storage/v1/object/public/',
    );
    u.search = '';
    return u.toString();
  } catch {
    return src;
  }
}

/**
 * Imagen para cards del feed/grid: archivo original escalado en CSS (ancho 100%).
 * No usar `/render/image?width=` solo: Supabase/imgproxy recorta con modo cover por defecto.
 */
export function getListingThumbnailUrl(
  src: string | undefined | null,
  width: number = LISTING_CARD_IMAGE_WIDTH,
  options?: { variant?: 'feed' | 'listThumb' },
): string | undefined {
  if (!src) return undefined;
  if (!isSupabaseStorageUrl(src)) return src;

  const variant = options?.variant ?? 'feed';

  try {
    const u = new URL(src);

    if (variant === 'feed') {
      return supabaseStorageObjectPublicUrl(u.toString());
    }

    // Miniatura lista: transformar con contain (nunca cover).
    if (u.pathname.includes('/render/image/')) {
      u.pathname = u.pathname.replace(
        '/storage/v1/render/image/public/',
        '/storage/v1/object/public/',
      );
    }
    if (!u.pathname.includes('/object/public/')) return src;

    u.pathname = u.pathname.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/',
    );
    u.search = new URLSearchParams({
      width: String(width),
      quality: '80',
      resize: 'contain',
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
  hasUserPhoto: boolean,
): string {
  if (vista === 'list') {
    return isCatalogProduct
      ? 'h-[112px] w-[112px] shrink-0'
      : 'h-24 w-24 shrink-0 md:h-24 md:w-24';
  }
  if (hasUserPhoto) {
    return 'w-full';
  }
  return 'aspect-square w-full';
}

/** Grid cards: never route through /_next/image (Vercel quota). */
export function shouldBypassVercelImageOptimization(src: string | undefined | null): boolean {
  if (!src) return false;
  return isSupabaseStorageUrl(src);
}
