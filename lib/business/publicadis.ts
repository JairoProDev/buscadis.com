import type { BusinessProfile } from '@/types/business';

const DEFAULT_PUBLICADIS_ORIGIN =
  process.env.NEXT_PUBLIC_PUBLICADIS_URL || 'https://publicadis.com';

const DEFAULT_BUSCADIS_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';

type SocialLinksRaw = BusinessProfile['social_links'] | Record<string, string> | null | undefined;

function readPublicadisFromObject(links: Record<string, unknown>): string | null {
  const direct = links.publicadis_site ?? links.publicadis_url ?? links.website;
  return typeof direct === 'string' && direct.length > 0 ? direct : null;
}

/** URL canónica del sitio profesional en Publicadis. */
export function getPublicadisSiteUrl(
  profile: Partial<BusinessProfile>,
  socialLinks?: SocialLinksRaw
): string | null {
  const links = socialLinks ?? profile.social_links;

  if (links && typeof links === 'object' && !Array.isArray(links)) {
    const fromObject = readPublicadisFromObject(links as Record<string, unknown>);
    if (fromObject) return fromObject;
  }

  if (Array.isArray(links)) {
    const hit = links.find(
      (l) =>
        l.url?.includes('publicadis.com') ||
        l.network === 'custom' && l.label?.toLowerCase().includes('sitio')
    );
    if (hit?.url) return hit.url;
  }

  if (profile.slug) {
    return `${DEFAULT_PUBLICADIS_ORIGIN.replace(/\/$/, '')}/p/${profile.slug}`;
  }

  return null;
}

/** URL canónica del perfil Buscadis (linktree). */
export function getBuscadisProfileUrl(profile: Partial<BusinessProfile>): string | null {
  if (!profile.slug) return null;
  return `${DEFAULT_BUSCADIS_ORIGIN.replace(/\/$/, '')}/p/${profile.slug}`;
}

export function hasPublicadisSite(profile: Partial<BusinessProfile>): boolean {
  return Boolean(getPublicadisSiteUrl(profile));
}
