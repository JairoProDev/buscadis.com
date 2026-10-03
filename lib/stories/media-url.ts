import type { Adiso } from '@/types';
import { adisoUsesGeneratedCover } from '@/lib/flyer/templates';
import { getSiteOrigin } from '@/lib/site-origin';

function siteOrigin(): string {
  return getSiteOrigin().replace(/\/$/, '');
}

/** Historia usa cover pre-renderizado en Storage (premium / clientes). */
export function getStoryCoverUrlFromPrivateData(adiso: Adiso): string | null {
  const priv =
    adiso.privateData && typeof adiso.privateData === 'object'
      ? (adiso.privateData as Record<string, unknown>)
      : {};
  const url = priv.story_cover_url ?? priv.coverUrl;
  if (typeof url === 'string' && url.trim()) return url.trim();
  return null;
}

export function getOgAdisoStoryUrl(adisoId: string): string {
  return `${siteOrigin()}/og/adiso/${adisoId}`;
}

export function isOgGeneratedStoryMedia(mediaUrl: string | undefined | null): boolean {
  if (!mediaUrl) return false;
  return /\/og\/adiso\//i.test(mediaUrl);
}

/**
 * URL de imagen para historias: Storage prewarm > foto usuario > OG plantilla.
 */
export function resolveStoryMediaUrl(adiso: Adiso): { url: string; mediaType: 'image' } {
  const prewarm = getStoryCoverUrlFromPrivateData(adiso);
  if (prewarm) return { url: prewarm, mediaType: 'image' };

  const photo = adiso.imagenesUrls?.find((u) => u?.trim()) || adiso.imagenUrl?.trim();
  if (photo && !adisoUsesGeneratedCover(adiso)) {
    return { url: photo, mediaType: 'image' };
  }

  return { url: getOgAdisoStoryUrl(adiso.id), mediaType: 'image' };
}
