import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.rol !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [
    { count: totalRequests },
    { count: pending },
    { count: delivered },
    { count: ridersPending },
    { count: ridersApproved },
    { count: phoneShared },
    { count: openClaims },
    { data: byUso },
    { data: byZona },
    { data: recent },
  ] = await Promise.all([
    supabaseAdmin.from('moto_requests').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('moto_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendiente'),
    supabaseAdmin
      .from('moto_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'entregado'),
    supabaseAdmin
      .from('moto_riders')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente'),
    supabaseAdmin
      .from('moto_riders')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'aprobado'),
    supabaseAdmin
      .from('moto_requests')
      .select('id', { count: 'exact', head: true })
      .not('phone_shared_at', 'is', null),
    supabaseAdmin
      .from('moto_claims')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'abierto'),
    supabaseAdmin.from('moto_requests').select('uso_detectado'),
    supabaseAdmin.from('moto_requests').select('pickup_zona'),
    supabaseAdmin
      .from('moto_requests')
      .select(
        'id, category, status, pickup_zona, fare_estimate, uso_detectado, phone_shared_at, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const usoCounts: Record<string, number> = {};
  for (const row of byUso || []) {
    const k = (row as { uso_detectado?: string }).uso_detectado || 'desconocido';
    usoCounts[k] = (usoCounts[k] || 0) + 1;
  }

  const zonaCounts: Record<string, number> = {};
  for (const row of byZona || []) {
    const k = (row as { pickup_zona?: string }).pickup_zona || 'sin_zona';
    zonaCounts[k] = (zonaCounts[k] || 0) + 1;
  }

  const deliveredN = delivered || 0;
  const phoneSharedN = phoneShared || 0;

  return NextResponse.json({
    totals: {
      requests: totalRequests || 0,
      pending: pending || 0,
      delivered: deliveredN,
      ridersPending: ridersPending || 0,
      ridersApproved: ridersApproved || 0,
      phoneShared: phoneSharedN,
      openClaims: openClaims || 0,
      chatOnlyPct:
        deliveredN > 0
          ? Math.round(((deliveredN - Math.min(phoneSharedN, deliveredN)) / deliveredN) * 100)
          : null,
    },
    usoDetectado: usoCounts,
    zonas: zonaCounts,
    recent: recent || [],
  });
}
