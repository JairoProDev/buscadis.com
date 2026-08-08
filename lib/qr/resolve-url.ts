/**
 * Única fuente de verdad para URLs codificadas en QR y redirects.
 *
 * Producción: www.buscadis.com (despliegue activo).
 * Subdominios adis.lat (market, www, apex) no tienen app desplegada — no usarlos.
 * Dominio corto opcional: NEXT_PUBLIC_QR_SHORT_DOMAIN solo cuando esté en Vercel/DNS.
 */

import { getBusinessProfilePath } from '@/lib/seo/business-metadata';

/** Origen canónico con despliegue verificado (Vercel). */
export const PRODUCTION_CANONICAL_ORIGIN = 'https://www.buscadis.com';

/** Hosts legacy sin app; ignorar aunque estén en env. */
const BLOCKED_HOSTS = new Set([
  'market.adis.lat',
  'adis.lat',
  'www.adis.lat',
]);

function parseOrigin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url.replace(/\/$/, '')).origin;
  } catch {
    return null;
  }
}

function isBlockedOrigin(origin: string): boolean {
  try {
    return BLOCKED_HOSTS.has(new URL(origin).hostname);
  } catch {
    return true;
  }
}

function isLocalDevOrigin(origin: string): boolean {
  try {
    const h = new URL(origin).hostname;
    return h === 'localhost' || h === '127.0.0.1';
  } catch {
    return false;
  }
}

/** Evita redirect apex → www en cada escaneo QR. */
export function normalizeCanonicalOrigin(origin: string): string {
  try {
    const u = new URL(origin);
    if (u.hostname === 'buscadis.com') {
      u.hostname = 'www.buscadis.com';
    }
    return u.origin;
  } catch {
    return PRODUCTION_CANONICAL_ORIGIN;
  }
}

/** Origen público para perfiles, SEO y redirect post-escaneo. */
export function getCanonicalSiteOrigin(): string {
  const app = parseOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (app && isLocalDevOrigin(app)) return app;

  const site = parseOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (site && !isBlockedOrigin(site)) {
    return normalizeCanonicalOrigin(site);
  }

  const appFallback = parseOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (appFallback && !isBlockedOrigin(appFallback)) {
    return normalizeCanonicalOrigin(appFallback);
  }

  return PRODUCTION_CANONICAL_ORIGIN;
}

/** Dominio codificado dentro del QR (debe servir /q/{code}). */
export function getQrShortDomain(): string {
  const custom = parseOrigin(process.env.NEXT_PUBLIC_QR_SHORT_DOMAIN);
  if (custom && !isBlockedOrigin(custom)) {
    return normalizeCanonicalOrigin(custom);
  }

  const app = parseOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (app && isLocalDevOrigin(app)) return app;

  return getCanonicalSiteOrigin();
}

/** URL corta dinámica que va dentro del QR. */
export function getQrTargetUrl(shortCode: string): string {
  return `${getQrShortDomain()}/q/${shortCode}`;
}

/** URL canónica del perfil tras redirect desde /q/{code}. */
export function getProfileRedirectUrl(slug: string, fromQr = true): string {
  const base = `${getCanonicalSiteOrigin()}${getBusinessProfilePath(slug)}`;
  if (!fromQr) return base;
  const params = new URLSearchParams({
    src: 'qr',
    utm_source: 'qr',
    utm_medium: 'scan',
    from_qr: '1',
  });
  return `${base}?${params.toString()}`;
}

/** Dominios permitidos para redirect (anti-quishing). */
export function isAllowedRedirectHost(hostname: string): boolean {
  const allowed = [
    'buscadis.com',
    'www.buscadis.com',
    'localhost',
    '127.0.0.1',
  ];
  if (allowed.includes(hostname)) return true;
  if (hostname.endsWith('.vercel.app')) return true;

  const custom = parseOrigin(process.env.NEXT_PUBLIC_QR_SHORT_DOMAIN);
  if (custom) {
    try {
      if (new URL(custom).hostname === hostname) return true;
    } catch {
      /* */
    }
  }

  const siteHost = parseOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (siteHost) {
    try {
      if (new URL(siteHost).hostname === hostname) return true;
    } catch {
      /* */
    }
  }

  return false;
}
