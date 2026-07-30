import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/** Historial + ingresos estimados del rider */
export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  const { data: rider } = await supabaseAdmin
    .from('moto_riders')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!rider) {
    return NextResponse.json({ error: 'No eres motorizado' }, { status: 403 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: rows } = await supabaseAdmin
    .from('moto_requests')
    .select(
      'id, status, distance_km, fare_estimate, fare_agreed, tip_amount, delivered_at, created_at, pickup_zona, category'
    )
    .eq('rider_id', rider.id)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(100);

  const delivered = (rows || []).filter((r) => r.status === 'entregado');
  const earnings = delivered.reduce((sum, r) => {
    const base = Number(r.fare_agreed ?? r.fare_estimate) || 0;
    const tip = Number(r.tip_amount) || 0;
    return sum + base + tip;
  }, 0);
  const km = delivered.reduce((sum, r) => sum + (Number(r.distance_km) || 0), 0);

  const byHour: Record<number, number> = {};
  const byZona: Record<string, number> = {};
  for (const r of rows || []) {
    if (r.status !== 'entregado' && r.status !== 'aceptado' && r.status !== 'recogido')
      continue;
    const h = new Date(r.created_at).getHours();
    byHour[h] = (byHour[h] || 0) + 1;
    const z = r.pickup_zona || 'Otra';
    byZona[z] = (byZona[z] || 0) + 1;
  }

  const topHours = Object.entries(byHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h, c]) => ({ hour: Number(h), count: c }));

  const topZonas = Object.entries(byZona)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([zona, count]) => ({ zona, count }));

  return NextResponse.json({
    rider: {
      id: rider.id,
      display_name: rider.display_name,
      rating_avg: rider.rating_avg,
      rating_count: rider.rating_count,
      online: rider.online,
    },
    summary: {
      delivered: delivered.length,
      earningsEstimate: Math.round(earnings * 100) / 100,
      km: Math.round(km * 10) / 10,
      last30Days: true,
    },
    demandHints: {
      topHours,
      topZonas,
      tip:
        topZonas[0] && topHours[0]
          ? `Suele haber más pedidos cerca de ${topZonas[0].zona} alrededor de las ${String(topHours[0].hour).padStart(2, '0')}:00`
          : 'Activa Online en picos 07–10 y 16–20 para ver más envíos.',
    },
    recent: (rows || []).slice(0, 20),
  });
}
