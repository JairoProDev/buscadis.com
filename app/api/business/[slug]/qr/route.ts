import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getBusinessProfileBySlug } from '@/lib/business';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';

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
  const format = req.nextUrl.searchParams.get('format') || 'png';

  if (format === 'svg') {
    const svg = await QRCode.toString(url, { type: 'svg', margin: 2, width: 400 });
    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
    });
  }

  const png = await QRCode.toBuffer(url, { type: 'png', margin: 2, width: 512 });
  return new NextResponse(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  });
}
