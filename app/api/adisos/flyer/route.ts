import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdisoUrl } from '@/lib/url';
import { generateFreeQrPng } from '@/lib/qr/generate-free';

const bodySchema = z.object({
  adisoId: z.string().min(1),
});

function buildFlyerSvg(params: {
  titulo: string;
  descripcion: string;
  categoria: string;
  adisoUrl: string;
  qrUrl: string;
}): string {
  const title = params.titulo.slice(0, 48).replace(/[<>&]/g, '');
  const desc = params.descripcion.slice(0, 120).replace(/[<>&]/g, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#facc15"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect x="60" y="60" width="960" height="1230" rx="32" fill="#ffffff" opacity="0.97"/>
  <text x="100" y="160" font-family="Arial,sans-serif" font-size="42" font-weight="bold" fill="#1e3a8a">BUSCADIS</text>
  <text x="100" y="280" font-family="Arial,sans-serif" font-size="52" font-weight="bold" fill="#111827">${title}</text>
  <text x="100" y="340" font-family="Arial,sans-serif" font-size="28" fill="#6b7280">${params.categoria}</text>
  <foreignObject x="100" y="380" width="880" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;font-size:26px;color:#374151;line-height:1.4">${desc}</div>
  </foreignObject>
  <image href="${params.qrUrl}" x="740" y="1000" width="240" height="240"/>
  <text x="100" y="1180" font-family="Arial,sans-serif" font-size="22" fill="#2563eb">${params.adisoUrl}</text>
  <text x="100" y="1220" font-family="Arial,sans-serif" font-size="20" fill="#6b7280">Escanea el QR · Publicado en Buscadis</text>
</svg>`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { data: adiso } = await supabaseAdmin
      .from('adisos')
      .select('id, titulo, descripcion, categoria, user_id, publish_tier, features')
      .eq('id', parsed.data.adisoId)
      .maybeSingle();

    if (!adiso) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 });
    }

    if (adiso.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tier = (adiso.publish_tier as string) || 'paid';
    const features = adiso.features as Record<string, unknown> | null;
    if (tier === 'free' || features?.flyer === false) {
      return NextResponse.json(
        { error: 'Flyer disponible solo en planes de pago', upsell: true },
        { status: 402 }
      );
    }

    const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://buscadis.com').replace(/\/$/, '');
    const adisoUrl = `${siteUrl}${getAdisoUrl({
      id: adiso.id,
      titulo: adiso.titulo as string,
      categoria: adiso.categoria as string,
      ubicacion: 'peru',
    } as import('@/types').Adiso)}`;

    const qrPng = await generateFreeQrPng({
      data: adisoUrl,
      themeColor: '#2563eb',
      width: 300,
    });
    const qrUrl = `data:image/png;base64,${qrPng.toString('base64')}`;

    const svg = buildFlyerSvg({
      titulo: adiso.titulo as string,
      descripcion: (adiso.descripcion as string) || '',
      categoria: adiso.categoria as string,
      adisoUrl,
      qrUrl,
    });

    return NextResponse.json({
      svg,
      qrUrl,
      shareUrl: adisoUrl,
      downloadName: `flyer-${adiso.id}.svg`,
    });
  } catch (e) {
    console.error('[adisos/flyer]', e);
    return NextResponse.json({ error: 'Error generando flyer' }, { status: 500 });
  }
}
