import { NextRequest, NextResponse } from 'next/server';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';

/**
 * Rutas canónicas de perfil Buscadis:
 * - Canónica: /@{slug}
 * - Alias legacy: /p/{slug} → redirect 308 a /@{slug}
 * - Alias corto: /{slug} → redirect vía catch-all si el negocio está publicado
 * - Perfil Vivo preview: /v/{slug} y /v/@{slug} (paralelo hasta cutover)
 *
 * Publicadis vive en publicadis.com — solo enlace desde botón Web del perfil.
 */
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

  // Perfil Vivo preview: /v/@slug → /v/slug (paralelo hasta cutover P03)
  const vAtMatch = pathname.match(/^\/v\/@([^/?#]+)\/?$/);
  if (vAtMatch) {
    const slug = normalizeBusinessSlug(vAtMatch[1]);
    if (slug) {
      return NextResponse.rewrite(
        new URL(`/v/${encodeURIComponent(slug)}${search}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?|css|js|map|txt|xml|webmanifest)$).*)',
  ],
};
