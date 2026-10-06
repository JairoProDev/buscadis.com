import { getCanonicalSiteUrl } from '@/lib/seo/canonical-site';

export function getSiteOrigin(): string {
  const fromApp = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromApp) {
    try {
      const host = new URL(fromApp).hostname;
      if (host === 'buscadis.com' || host === 'www.buscadis.com') {
        return getCanonicalSiteUrl();
      }
      return fromApp;
    } catch {
      return getCanonicalSiteUrl();
    }
  }
  return getCanonicalSiteUrl();
}
