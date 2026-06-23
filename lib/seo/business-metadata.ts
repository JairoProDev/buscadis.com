import type { Metadata } from 'next';
import type { BusinessProfile } from '@/types/business';
import {
  getDefaultOgImageUrl,
  getSiteUrl,
  DEFAULT_OG_IMAGE_WIDTH,
  DEFAULT_OG_IMAGE_HEIGHT,
} from '@/lib/seo/og-image';

function toAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return getDefaultOgImageUrl();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const site = getSiteUrl();
  return `${site}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

function isSvgUrl(url: string): boolean {
  return /\.svg($|\?)/i.test(url);
}

/** Imagen OG para perfiles: JPG/PNG preferido (WhatsApp no previsualiza SVG). */
export function resolveBusinessOgImageUrl(profile: {
  og_image_url?: string | null;
  banner_url?: string | null;
  logo_url?: string | null;
}): string {
  if (profile.og_image_url?.trim()) return toAbsoluteUrl(profile.og_image_url);
  if (profile.banner_url?.trim()) return toAbsoluteUrl(profile.banner_url);
  if (profile.logo_url?.trim() && !isSvgUrl(profile.logo_url)) {
    return toAbsoluteUrl(profile.logo_url);
  }
  return getDefaultOgImageUrl();
}

function stripBuscadisSuffix(text: string): string {
  return text.replace(/\s*[|\-–—]\s*Buscadis\s*$/i, '').trim();
}

export function buildBusinessShareTitle(profile: {
  name: string;
  tagline?: string | null;
  meta_title?: string | null;
}): string {
  if (profile.meta_title?.trim()) {
    return stripBuscadisSuffix(profile.meta_title);
  }
  if (profile.tagline?.trim()) {
    return `${profile.name} — ${profile.tagline}`;
  }
  return profile.name;
}

export function buildBusinessShareDescription(profile: {
  name: string;
  description?: string | null;
  meta_description?: string | null;
  tagline?: string | null;
  contact_address?: string | null;
}): string {
  const raw =
    profile.meta_description?.trim() ||
    profile.description?.trim() ||
    profile.tagline?.trim() ||
    `Conoce ${profile.name} en Buscadis.`;
  const text = stripBuscadisSuffix(raw);
  return text.length > 200 ? `${text.slice(0, 197)}...` : text;
}

export function getBusinessProfilePath(slug: string): string {
  return `/p/${slug}`;
}

export function getBusinessProfileShareUrl(slug: string): string {
  return `${getSiteUrl()}${getBusinessProfilePath(slug)}`;
}

/** OG/Twitter al compartir buscadis.com/p/{slug} — prioriza marca del negocio. */
export function buildBusinessShareMetadata(
  profile: Pick<
    BusinessProfile,
    | 'slug'
    | 'name'
    | 'tagline'
    | 'description'
    | 'meta_title'
    | 'meta_description'
    | 'og_image_url'
    | 'banner_url'
    | 'logo_url'
  >
): Metadata {
  const path = getBusinessProfilePath(profile.slug);
  const url = `${getSiteUrl()}${path}`;
  const title = buildBusinessShareTitle(profile);
  const description = buildBusinessShareDescription(profile);
  const imageUrl = resolveBusinessOgImageUrl(profile);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Buscadis',
      locale: 'es_PE',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: DEFAULT_OG_IMAGE_WIDTH,
          height: DEFAULT_OG_IMAGE_HEIGHT,
          alt: profile.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function buildBusinessNotFoundMetadata(): Metadata {
  return { title: 'Negocio no encontrado' };
}
