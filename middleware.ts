import { NextRequest, NextResponse } from 'next/server';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';

/** Hosts legacy sin app propia → mismo origen canónico (QR impresos antiguos). */
const LEGACY_QR_HOSTS = new Set(['market.adis.lat', 'www.adis.lat', 'adis.lat']);

export function middleware(req: NextRequest) {
  const host = req.headers.get('host')?.split(':')[0] ?? '';
  const { pathname, search } = req.nextUrl;

  if (LEGACY_QR_HOSTS.has(host)) {
    const canonical = 'https://www.buscadis.com';
    return NextResponse.redirect(`${canonical}${pathname}${search}`, 308);
  }

  // Alias legacy /p/slug → canónico /@slug (sin redirigir a Publicadis)
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
