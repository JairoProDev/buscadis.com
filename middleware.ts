import { NextRequest, NextResponse } from 'next/server';

/** Hosts legacy sin app propia → mismo origen canónico (QR impresos antiguos). */
const LEGACY_QR_HOSTS = new Set(['market.adis.lat', 'www.adis.lat', 'adis.lat']);

export function middleware(req: NextRequest) {
  const host = req.headers.get('host')?.split(':')[0] ?? '';
  if (!LEGACY_QR_HOSTS.has(host)) return NextResponse.next();

  const canonical = 'https://www.buscadis.com';
  const { pathname, search } = req.nextUrl;
  return NextResponse.redirect(`${canonical}${pathname}${search}`, 308);
}

export const config = {
  matcher: ['/q/:path*', '/p/:path*', '/api/business/:path*'],
};
