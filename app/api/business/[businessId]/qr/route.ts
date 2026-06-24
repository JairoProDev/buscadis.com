import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProfileBySlugAdmin } from '@/lib/qr/get-business-admin';
import { getQrTargetUrl } from '@/lib/qr/resolve-url';
import { ensureQrCodeForBusiness, getQrByBusinessId } from '@/lib/qr/service';
import { generateQrPng, generateQrSvg } from '@/lib/qr/generate';
import { canUseProQr } from '@/lib/business/subscription';
import { buildFreeStyleConfig, resolveRenderMode } from '@/lib/qr/presets';
import { applyPreviewStyleOverrides } from '@/lib/qr/preview-params';
import {
  computeQrAssetHash,
  downloadCachedQrPng,
  isCacheValid,
  persistQrAssetCache,
  persistQrQaStatus,
  qrAssetStoragePath,
  uploadCachedQrPng,
} from '@/lib/qr/asset-cache';
import type { QrRenderMode } from '@/lib/qr/types';

export const runtime = 'nodejs';

/** businessId is the public business slug for this route */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const slug = decodeURIComponent(businessId);
    const profile = await getBusinessProfileBySlugAdmin(slug);
    if (!profile) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    let qr = await getQrByBusinessId(profile.id);
    if (!qr) {
      qr = await ensureQrCodeForBusiness({
        businessProfileId: profile.id,
        slug: profile.slug,
        themeColor: profile.theme_color,
      });
    }
    if (!qr) {
      return NextResponse.json(
        { error: 'No se pudo provisionar el QR. Ejecuta npm run db:migrate' },
        { status: 500 }
      );
    }

    const targetUrl = getQrTargetUrl(qr.short_code);
    const format = req.nextUrl.searchParams.get('format') || 'png';
    const tierParam = req.nextUrl.searchParams.get('tier');
    const wantsPro = tierParam === 'pro' || qr.style_tier === 'pro';
    const usePro = wantsPro && canUseProQr(profile);
    const modeParam = req.nextUrl.searchParams.get('mode') as QrRenderMode | null;
    const widthParam = Number.parseInt(req.nextUrl.searchParams.get('width') || '', 10);
    const maxWidth = usePro ? 2048 : 1024;
    const defaultWidth = format === 'pdf' ? 1024 : format === 'svg' ? 400 : 512;
    const width =
      Number.isFinite(widthParam) && widthParam > 0
        ? Math.min(widthParam, maxWidth)
        : defaultWidth;

    const isPreview = req.nextUrl.searchParams.get('preview') === '1';

    const styleConfig = applyPreviewStyleOverrides(
      {
        ...buildFreeStyleConfig(profile.theme_color),
        ...(qr.style_config || {}),
        dotsColor: qr.style_config?.dotsColor || profile.theme_color || '#1e293b',
      },
      req.nextUrl.searchParams
    );

    const renderMode =
      modeParam && ['classic', 'branded', 'visual'].includes(modeParam)
        ? modeParam
        : resolveRenderMode(styleConfig, qr.render_mode || 'branded');

    if (format === 'svg') {
      const svg = await generateQrSvg({
        data: targetUrl,
        styleConfig,
        width,
        logoUrl: profile.logo_url,
        themeColor: profile.theme_color,
        tier: usePro ? 'pro' : 'free',
        renderMode,
      });
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
          'X-QR-Mode': renderMode,
        },
      });
    }

    if (format === 'pdf') {
      if (!usePro) {
        return NextResponse.json({ error: 'PDF disponible en plan Pro' }, { status: 403 });
      }
      const result = await generateQrPng({
        data: targetUrl,
        styleConfig,
        width: 1024,
        logoUrl: profile.logo_url,
        themeColor: profile.theme_color,
        tier: 'pro',
        renderMode,
      });
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const dataUrl = `data:image/png;base64,${result.png.toString('base64')}`;
      const pageW = doc.internal.pageSize.getWidth();
      const qrSize = 80;
      doc.addImage(dataUrl, 'PNG', (pageW - qrSize) / 2, 40, qrSize, qrSize);
      doc.setFontSize(14);
      doc.text(profile.name, pageW / 2, 130, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Escanea para ver nuestro perfil en Buscadis', pageW / 2, 140, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Mín. 2.5 cm · Prueba el escaneo antes de imprimir en volumen', pageW / 2, 150, {
        align: 'center',
      });
      const pdfBuf = Buffer.from(doc.output('arraybuffer'));
      return new NextResponse(pdfBuf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${profile.slug}-qr.pdf"`,
          'Cache-Control': 'private, max-age=3600',
          'X-QR-Mode': result.actualMode,
          'X-QR-QA-Status': result.qaStatus,
        },
      });
    }

    const assetHash = computeQrAssetHash({
      targetUrl,
      logoUrl: profile.logo_url,
      shortCode: qr.short_code,
      styleConfig,
      tier: usePro ? 'pro' : 'free',
      width,
      renderMode,
    });

    if (
      !isPreview &&
      isCacheValid(qr, assetHash) &&
      qr.cached_png_path &&
      !req.nextUrl.searchParams.has('refresh')
    ) {
      const cached = await downloadCachedQrPng(qr.cached_png_path);
      if (cached) {
        return new NextResponse(new Uint8Array(cached), {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
            ETag: `"${assetHash}"`,
            'X-QR-Mode': qr.render_mode || renderMode,
            'X-QR-QA-Status': qr.qa_status || 'passed',
          },
        });
      }
    }

    const result = await generateQrPng({
      data: targetUrl,
      styleConfig,
      width,
      logoUrl: profile.logo_url,
      themeColor: profile.theme_color,
      tier: usePro ? 'pro' : 'free',
      renderMode,
      skipQa: width < 256 || isPreview,
    });

    const storagePath = qrAssetStoragePath(profile.id, assetHash);
    void uploadCachedQrPng(storagePath, result.png).then(async (ok) => {
      if (ok) {
        await persistQrAssetCache(qr!.id, assetHash, storagePath);
        await persistQrQaStatus(qr!.id, {
          qa_status: result.qaStatus,
          qa_fallback_mode: result.degraded ? result.actualMode : null,
          render_mode: result.actualMode,
          generation_error: null,
        });
      }
    });

    return new NextResponse(new Uint8Array(result.png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
        ETag: `"${assetHash}"`,
        'X-QR-Mode': result.actualMode,
        'X-QR-QA-Status': result.qaStatus,
      },
    });
  } catch (err) {
    console.error('[qr/route]', err);
    return NextResponse.json({ error: 'Error al generar el QR' }, { status: 500 });
  }
}
