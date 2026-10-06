import { PRODUCTION_CANONICAL_ORIGIN } from '@/lib/qr/resolve-url';

/** Origen público canónico (www) para SEO, sitemap, JSON-LD y OG. */
export function getCanonicalSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) {
    try {
      const host = new URL(fromEnv).hostname;
      if (host === 'buscadis.com') {
        return PRODUCTION_CANONICAL_ORIGIN;
      }
      return fromEnv;
    } catch {
      return PRODUCTION_CANONICAL_ORIGIN;
    }
  }
  return PRODUCTION_CANONICAL_ORIGIN;
}

export const CANONICAL_HOST = 'www.buscadis.com';
export const APEX_HOST = 'buscadis.com';
