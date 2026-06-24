import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getBusinessProfileBySlugAdmin } from '@/lib/qr/get-business-admin';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';
import { canUseProQr } from '@/lib/business/subscription';
import { ensureQrCodeForBusiness } from '@/lib/qr/service';
import { getQrTargetUrl } from '@/lib/qr/resolve-url';
import { buildKitSvg } from '@/lib/qr/templates';
import type { QrKitTemplate } from '@/lib/qr/types';

export const runtime = 'nodejs';

const PRO_TEMPLATES: QrKitTemplate[] = [
  'story',
  'table-tent',
  'poster',
  'business-card',
  'packaging',
];

/** businessId is slug */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const slug = decodeURIComponent((await params).businessId);
    const profile = await getBusinessProfileBySlugAdmin(slug);
    if (!profile) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const template = (req.nextUrl.searchParams.get('template') || 'flyer-basic') as QrKitTemplate;
    const format = req.nextUrl.searchParams.get('format') || 'svg';
    const isPro = canUseProQr(profile);

    if (PRO_TEMPLATES.includes(template) && !isPro) {
      return NextResponse.json({ error: 'Plantilla disponible en plan Pro' }, { status: 403 });
    }

    const qr = await ensureQrCodeForBusiness({
      businessProfileId: profile.id,
      slug: profile.slug,
      themeColor: profile.theme_color,
    });
    if (!qr) {
      return NextResponse.json({ error: 'QR no disponible' }, { status: 500 });
    }

    const kit = await buildKitSvg(template, {
      businessName: profile.name,
      tagline: profile.tagline || profile.description?.slice(0, 80) || 'Visítanos en Buscadis',
      themeColor: profile.theme_color || '#3c6997',
      profileUrl: getBusinessCanonicalUrl(profile.slug),
      qrTargetUrl: getQrTargetUrl(qr.short_code),
      styleConfig: qr.style_config || {},
      usePro: isPro,
      logoUrl: profile.logo_url,
    });

    if (format === 'png') {
      const png = await sharp(Buffer.from(kit.svg), { density: 150 })
        .png()
        .toBuffer();
      return new NextResponse(new Uint8Array(png), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${profile.slug}-${template}.png"`,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (format === 'pdf' && isPro) {
      const png = await sharp(Buffer.from(kit.svg), { density: 150 })
        .png()
        .toBuffer();
      const { jsPDF } = await import('jspdf');
      const aspect = kit.height / kit.width;
      const pageW = 210;
      const pageH = pageW * aspect;
      const doc = new jsPDF({
        unit: 'mm',
        format: [pageW, pageH],
        orientation: pageW > pageH ? 'landscape' : 'portrait',
      });
      const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
      doc.addImage(dataUrl, 'PNG', 0, 0, pageW, pageH);
      const pdfBuf = Buffer.from(doc.output('arraybuffer'));
      return new NextResponse(pdfBuf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${profile.slug}-${template}.pdf"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }

    return new NextResponse(kit.svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${profile.slug}-${template}.svg"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[qr-kit]', err);
    const message = err instanceof Error ? err.message : 'Error al generar kit';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
