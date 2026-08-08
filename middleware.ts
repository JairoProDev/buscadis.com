import { NextRequest, NextResponse } from 'next/server';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import {
  isPerfilVivoEnvCohortSlug,
  isPerfilVivoHardCutover,
  listPerfilVivoEnvCohort,
} from '@/lib/business/perfil-vivo-flag';

/**
 * Rutas canónicas de perfil Buscadis:
 * - Canónica: /@{slug}
 * - Alias legacy: /p/{slug} → redirect 308 a /@{slug}
 * - Perfil Vivo preview: /v/{slug} y /v/@{slug}
 * - Edge flag: cohort env / hard cutover → header x-perfil-vivo para /negocio
 */
const LEGACY_QR_HOSTS = new Set(['market.adis.lat', 'www.adis.lat', 'adis.lat']);

function withPerfilVivoHeader(res: NextResponse, slug: string): NextResponse {
  const edgeOn =
    isPerfilVivoHardCutover() || isPerfilVivoEnvCohortSlug(slug);
  if (edgeOn) {
    res.headers.set('x-perfil-vivo', '1');
    res.headers.set('x-perfil-vivo-source', isPerfilVivoHardCutover() ? 'hard' : 'env');
  }
  // Evita cachear HTML distinto por cohort entre edge nodes
  if (listPerfilVivoEnvCohort().length > 0 || isPerfilVivoHardCutover()) {
    res.headers.set('Vary', 'x-perfil-vivo');
  }
  return res;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host')?.split(':')[0] ?? '';
  const { pathname, search } = req.nextUrl;

  if (LEGACY_QR_HOSTS.has(host)) {
    const canonical = 'https://www.buscadis.com';
    return NextResponse.redirect(`${canonical}${pathname}${search}`, 308);
  }

  const pMatch = pathname.match(/^\/p\/([^/?#]+)\/?$/);
  if (pMatch) {
    const slug = normalizeBusinessSlug(pMatch[1]);
    if (slug) {
      return NextResponse.redirect(new URL(`/@${slug}${search}`, req.url), 308);
    }
  }

  const atMatch = pathname.match(/^\/@([^/?#]+)\/?$/);
  if (atMatch) {
    const slug = normalizeBusinessSlug(atMatch[1]);
    if (slug) {
      const vivo =
        req.nextUrl.searchParams.get('vivo') === '1' ||
        req.nextUrl.searchParams.get('perfilVivo') === '1';
      if (vivo) {
        const url = new URL(`/v/${encodeURIComponent(slug)}`, req.url);
        url.searchParams.delete('vivo');
        url.searchParams.delete('perfilVivo');
        req.nextUrl.searchParams.forEach((v, k) => {
          if (k !== 'vivo' && k !== 'perfilVivo') url.searchParams.set(k, v);
        });
        return NextResponse.rewrite(url);
      }
      const rewritten = NextResponse.rewrite(
        new URL(`/negocio/${encodeURIComponent(slug)}${search}`, req.url)
      );
      return withPerfilVivoHeader(rewritten, slug);
    }
  }

  const atProdMatch = pathname.match(/^\/@([^/?#]+)\/producto\/([^/?#]+)\/?$/);
  if (atProdMatch) {
    const slug = normalizeBusinessSlug(atProdMatch[1]);
    const productoId = atProdMatch[2];
    if (slug && productoId) {
      return NextResponse.rewrite(
        new URL(
          `/v/${encodeURIComponent(slug)}/producto/${encodeURIComponent(productoId)}${search}`,
          req.url
        )
      );
    }
  }

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
