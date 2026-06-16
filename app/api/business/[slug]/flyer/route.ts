import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProfileBySlug } from '@/lib/business';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';

function buildFlyerSvg(params: {
  name: string;
  tagline: string;
  url: string;
  qrUrl: string;
  color: string;
}): string {
  const name = params.name.slice(0, 48).replace(/[<>&]/g, '');
  const tagline = params.tagline.slice(0, 80).replace(/[<>&]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect width="1080" height="1920" fill="${params.color}"/>
  <rect x="60" y="120" width="960" height="1680" rx="40" fill="#ffffff"/>
  <text x="100" y="280" font-family="Arial,sans-serif" font-size="36" font-weight="bold" fill="#64748b">BUSCADIS</text>
  <text x="100" y="420" font-family="Arial,sans-serif" font-size="64" font-weight="bold" fill="#0f172a">${name}</text>
  <text x="100" y="500" font-family="Arial,sans-serif" font-size="32" fill="#475569">${tagline}</text>
  <image href="${params.qrUrl}" x="340" y="1100" width="400" height="400"/>
  <text x="100" y="1620" font-family="Arial,sans-serif" font-size="24" fill="#2563eb">${params.url}</text>
  <text x="100" y="1680" font-family="Arial,sans-serif" font-size="22" fill="#94a3b8">Escanea el QR · Tu tarjeta digital</text>
</svg>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const profile = await getBusinessProfileBySlug(decoded);
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  const url = getBusinessCanonicalUrl(profile.slug);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const qrUrl = `${appUrl}/api/business/${encodeURIComponent(profile.slug)}/qr?format=png`;
  const svg = buildFlyerSvg({
    name: profile.name,
    tagline: profile.tagline || profile.description?.slice(0, 80) || 'Visítanos en Buscadis',
    url,
    qrUrl,
    color: profile.theme_color || '#3c6997',
  });

  const format = req.nextUrl.searchParams.get('format');
  if (format === 'json') {
    return NextResponse.json({ svg, url });
  }

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `attachment; filename="${profile.slug}-flyer.svg"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
