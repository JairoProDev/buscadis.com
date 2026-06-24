import { NextRequest, NextResponse } from 'next/server';

/** Hosts legacy sin app propia → mismo origen canónico (QR impresos antiguos). */
const LEGACY_QR_HOSTS = new Set(['market.adis.lat', 'www.adis.lat', 'adis.lat']);

export function middleware(req: NextRequest) {
  const host = req.headers.get('host')?.split(':')[0] ?? '';
  const { pathname, search } = req.nextUrl;

  if (LEGACY_QR_HOSTS.has(host)) {
    const canonical = 'https://www.buscadis.com';
    return NextResponse.redirect(`${canonical}${pathname}${search}`, 308);
  }

  // Legacy /p/slug → /@slug (perfiles @handle usan rewrite en next.config.js)
  const pMatch = pathname.match(/^\/p\/([^/]+)\/?$/);
  if (pMatch) {
    const slug = pMatch[1];
    return NextResponse.redirect(new URL(`/@${slug}${search}`, req.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/q/:path*', '/p/:path*', '/api/business/:path*'],
};
