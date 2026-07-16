import type { BusinessProfile } from '@/types/business';
import { getBusinessProfilePath } from '@/lib/seo/business-metadata';

// Dominio principal de Publicadis caído (registro vencido). Servimos los sitios
// profesionales desde el ecosistema adis.lat mientras tanto.
const ADIS_ROOT_DOMAIN = 'adis.lat';

// Negocios con microsite propio publicado en <slug>.adis.lat
const PUBLICADIS_SUBDOMAIN_SLUGS = new Set(['villachaco', 'quival', 'agrilsur']);

// Fallback estable para slugs sin subdominio dedicado (evita el dominio caído).
const DEFAULT_PUBLICADIS_ORIGIN = (
  process.env.NEXT_PUBLIC_PUBLICADIS_URL || 'https://publicadis.adis.lat'
).replace(/\/$/, '');

const DEFAULT_BUSCADIS_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com';

type SocialLinksRaw = BusinessProfile['social_links'] | Record<string, string> | null | undefined;

/** Reescribe enlaces al dominio caído publicadis.com hacia el ecosistema adis.lat. */
function healPublicadisUrl(url: string): string {
  return url.replace(
    /^https?:\/\/(www\.)?publicadis\.com/i,
    DEFAULT_PUBLICADIS_ORIGIN
  );
}

/** URL del microsite: subdominio dedicado si existe, si no el fallback en adis.lat. */
function buildSiteUrlFromSlug(slug: string): string {
  if (PUBLICADIS_SUBDOMAIN_SLUGS.has(slug)) {
    return `https://${slug}.${ADIS_ROOT_DOMAIN}`;
  }
  return `${DEFAULT_PUBLICADIS_ORIGIN}/p/${slug}`;
}

function readPublicadisFromObject(links: Record<string, unknown>): string | null {
  const direct = links.publicadis_site ?? links.publicadis_url ?? links.website;
  return typeof direct === 'string' && direct.length > 0 ? direct : null;
}

/** URL canónica del sitio profesional (ecosistema adis.lat). */
export function getPublicadisSiteUrl(
  profile: Partial<BusinessProfile>,
  socialLinks?: SocialLinksRaw
): string | null {
  const links = socialLinks ?? profile.social_links;

  // Preferimos el subdominio dedicado sobre enlaces guardados al dominio caído.
  if (profile.slug && PUBLICADIS_SUBDOMAIN_SLUGS.has(profile.slug)) {
    return buildSiteUrlFromSlug(profile.slug);
  }

  if (links && typeof links === 'object' && !Array.isArray(links)) {
    const fromObject = readPublicadisFromObject(links as Record<string, unknown>);
    if (fromObject) return healPublicadisUrl(fromObject);
  }

  if (Array.isArray(links)) {
    const hit = links.find(
      (l) =>
        l.url?.includes('publicadis.com') ||
        l.url?.includes('publicadis.adis.lat') ||
        (l.network === 'custom' && l.label?.toLowerCase().includes('sitio'))
    );
    if (hit?.url) return healPublicadisUrl(hit.url);
  }

  if (profile.slug) {
    return buildSiteUrlFromSlug(profile.slug);
  }

  return null;
}

/** URL canónica del perfil Buscadis (linktree). */
export function getBuscadisProfileUrl(profile: Partial<BusinessProfile>): string | null {
  if (!profile.slug) return null;
  return `${DEFAULT_BUSCADIS_ORIGIN.replace(/\/$/, '')}${getBusinessProfilePath(profile.slug)}`;
}

export function hasPublicadisSite(profile: Partial<BusinessProfile>): boolean {
  return Boolean(getPublicadisSiteUrl(profile));
}
