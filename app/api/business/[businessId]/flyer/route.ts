import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProfileBySlugAdmin } from '@/lib/qr/get-business-admin';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';
import { ensureQrCodeForBusiness } from '@/lib/qr/service';
import { getQrTargetUrl } from '@/lib/qr/resolve-url';
import { buildKitSvg } from '@/lib/qr/templates';
import { canUseProQr } from '@/lib/business/subscription';
import { QR_KIT } from '@/lib/qr/kit-colors';

/** businessId is the public business slug for this route */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const profile = await getBusinessProfileBySlugAdmin(decodeURIComponent(businessId));
  if (!profile) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  const qr = await ensureQrCodeForBusiness({
    businessProfileId: profile.id,
    slug: profile.slug,
    themeColor: profile.theme_color,
  });
  if (!qr) {
    return NextResponse.json({ error: 'QR no disponible' }, { status: 500 });
  }

  const url = getBusinessCanonicalUrl(profile.slug);
  const kit = await buildKitSvg('flyer-basic', {
    businessName: profile.name,
    tagline: profile.tagline || profile.description?.slice(0, 80) || 'Visítanos en Buscadis',
    themeColor: profile.theme_color || QR_KIT.defaultTheme,
    profileUrl: url,
    qrTargetUrl: getQrTargetUrl(qr.short_code),
    styleConfig: qr.style_config || {},
    usePro: canUseProQr(profile) && qr.style_tier === 'pro',
    logoUrl: profile.logo_url,
  });

  const format = req.nextUrl.searchParams.get('format');
  if (format === 'json') {
    return NextResponse.json({ svg: kit.svg, url });
  }

  return new NextResponse(kit.svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `attachment; filename="${profile.slug}-flyer.svg"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
