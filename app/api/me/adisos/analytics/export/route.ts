import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getAdisoMetricsForUser } from '@/lib/analytics/adiso-metrics';

function toCsv(summary: Awaited<ReturnType<typeof getAdisoMetricsForUser>>): string {
  const header =
    'adiso_id,titulo,categoria,activo,impresiones,clicks,contactos,favoritos,ctr,contact_rate,legacy_vistas,legacy_contactos';
  const lines = summary.adisos.map((r) =>
    [
      r.adisoId,
      `"${r.titulo.replace(/"/g, '""')}"`,
      r.categoria ?? '',
      r.estaActivo ? '1' : '0',
      r.impressions,
      r.clicks,
      r.contacts,
      r.favorites,
      r.ctr.toFixed(4),
      r.contactRate.toFixed(4),
      r.legacyVistas,
      r.legacyContactos,
    ].join(',')
  );
  return [header, ...lines].join('\n');
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const daysParam = request.nextUrl.searchParams.get('days');
  const days = daysParam === '7' ? 7 : 30;

  try {
    const summary = await getAdisoMetricsForUser(user.id, days);
    const csv = toCsv(summary);
    const filename = `buscadis-resultados-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
