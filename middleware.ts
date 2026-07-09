import { NextRequest, NextResponse } from 'next/server';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';

/** Hosts legacy sin app propia → mismo origen canónico (QR impresos antiguos). */
const LEGACY_QR_HOSTS = new Set(['market.adis.lat', 'www.adis.lat', 'adis.lat']);

const PUBLICADIS_ORIGIN = (
  process.env.NEXT_PUBLIC_PUBLICADIS_URL || 'https://publicadis.com'
).replace(/\/$/, '');

/**
 * Sitios estáticos Publicadis que vivían en public/ de buscadis.com.
 * - /{slug} → perfil Buscadis /@slug
 * - /{slug}/… → publicadis.com/p/{slug}
 */
const LEGACY_PUBLICADIS_STATIC_SLUGS = new Set(['villachaco']);

export function middleware(req: NextRequest) {
  const host = req.headers.get('host')?.split(':')[0] ?? '';
  const { pathname, search } = req.nextUrl;

  if (LEGACY_QR_HOSTS.has(host)) {
    const canonical = 'https://www.buscadis.com';
    return NextResponse.redirect(`${canonical}${pathname}${search}`, 308);
  }

  // Legacy Publicadis static on buscadis.com → dominio Publicadis o perfil Buscadis
  const legacyStatic = pathname.match(/^\/([^/?#]+)(\/.*)?$/);
  if (legacyStatic) {
    const bare = normalizeBusinessSlug(legacyStatic[1]);
    const rest = legacyStatic[2] || '';
    if (bare && LEGACY_PUBLICADIS_STATIC_SLUGS.has(bare)) {
      if (!rest || rest === '/') {
        return NextResponse.redirect(new URL(`/@${bare}${search}`, req.url), 308);
      }
      const publicadisPath = rest.startsWith('/images/')
        ? `/villachaco${rest}`
        : `/p/${bare}${rest === '/index.html' ? '' : rest}`;
      return NextResponse.redirect(`${PUBLICADIS_ORIGIN}${publicadisPath}${search}`, 308);
    }
  }

  // Legacy /p/slug → /@slug
  const pMatch = pathname.match(/^\/p\/([^/?#]+)\/?$/);
  if (pMatch) {
    const slug = normalizeBusinessSlug(pMatch[1]);
    if (slug) {
      return NextResponse.redirect(new URL(`/@${slug}${search}`, req.url), 308);
    }
  }

  // /@slug → app interna /negocio/slug
  const atMatch = pathname.match(/^\/@([^/?#]+)\/?$/);
  if (atMatch) {
    const slug = normalizeBusinessSlug(atMatch[1]);
    if (slug) {
      return NextResponse.rewrite(new URL(`/negocio/${encodeURIComponent(slug)}${search}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?|css|js|map|txt|xml|webmanifest)$).*)',
  ],
};
