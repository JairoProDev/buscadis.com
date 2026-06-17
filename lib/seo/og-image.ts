import type { Metadata } from 'next';

/** Imagen OG por defecto al compartir links (WhatsApp, Facebook, etc.) */
export const DEFAULT_OG_IMAGE_PATH = '/og-image.jpg';
export const DEFAULT_OG_IMAGE_ALT =
  'Buscadis — Encuentra ofertas y oportunidades en empleos, inmuebles, vehículos y más';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');
}

export function getDefaultOgImageUrl(): string {
  return `${getSiteUrl()}${DEFAULT_OG_IMAGE_PATH}`;
}

function toAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return getDefaultOgImageUrl();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `${getSiteUrl()}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/** Usa la foto del aviso si existe; si no, el banner genérico de marca */
export function resolveAdisoOgImage(adiso: {
  imagenUrl?: string | null;
  imagenesUrls?: string[] | null;
}): string {
  const fromGallery = adiso.imagenesUrls?.find((u) => u?.trim());
  const candidate = fromGallery || adiso.imagenUrl?.trim();
  if (!candidate) return getDefaultOgImageUrl();
  return toAbsoluteUrl(candidate);
}

export function adisoHasShareImage(adiso: {
  imagenUrl?: string | null;
  imagenesUrls?: string[] | null;
}): boolean {
  return Boolean(adiso.imagenesUrls?.some((u) => u?.trim()) || adiso.imagenUrl?.trim());
}

export function buildDefaultOgImageMeta(): NonNullable<Metadata['openGraph']>['images'] {
  return [
    {
      url: getDefaultOgImageUrl(),
      width: DEFAULT_OG_IMAGE_WIDTH,
      height: DEFAULT_OG_IMAGE_HEIGHT,
      alt: DEFAULT_OG_IMAGE_ALT,
      type: 'image/jpeg',
    },
  ];
}

export function buildDefaultTwitterImageMeta(): NonNullable<Metadata['twitter']>['images'] {
  return [getDefaultOgImageUrl()];
}

/** Bloque OG reutilizable para páginas sin imagen propia */
export function withDefaultShareImage(partial: {
  title: string;
  description: string;
  url?: string;
  type?: 'website' | 'article';
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      title: partial.title,
      description: partial.description,
      url: partial.url,
      siteName: 'Buscadis',
      locale: 'es_PE',
      type: partial.type ?? 'website',
      images: buildDefaultOgImageMeta(),
    },
    twitter: {
      card: 'summary_large_image',
      title: partial.title,
      description: partial.description,
      images: buildDefaultTwitterImageMeta(),
    },
  };
}
