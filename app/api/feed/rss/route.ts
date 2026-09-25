import { NextRequest, NextResponse } from 'next/server';
import { getAdisosFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Obtener adisos activos más recientes
    const adisos = await getAdisosFromSupabase({
      limit: Math.min(limit, 100),
      offset: 0,
      soloActivos: true
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://adis.lat';
    const fechaActual = new Date().toUTCString();

    // Generar RSS 2.0
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rueda de Negocios - Adisos Clasificados</title>
    <link>${siteUrl}</link>
    <description>Adisos clasificados de Cusco, Perú</description>
    <language>es-PE</language>
    <lastBuildDate>${fechaActual}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed/rss" rel="self" type="application/rss+xml"/>
    ${adisos.map(adiso => {
      const fechaPub = new Date(`${adiso.fechaPublicacion}T${adiso.horaPublicacion}:00`).toUTCString();
      const link = `${siteUrl}/${adiso.categoria}/${adiso.id}`;
      const descripcion = (adiso.descripcion || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const titulo = adiso.titulo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return `    <item>
      <title>${titulo}</title>
      <link>${link}</link>
      <description>${descripcion}</description>
      <category>${adiso.categoria}</category>
      <pubDate>${fechaPub}</pubDate>
      <guid isPermaLink="true">${link}</guid>
    </item>`;
    }).join('\n')}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error: any) {
    console.error('Error al generar RSS:', error);
    return NextResponse.json(
      { error: 'Error al generar RSS feed' },
      { status: 500 }
    );
  }
}











