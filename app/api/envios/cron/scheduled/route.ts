import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyRidersNewRequest, type MotoRequest } from '@/lib/envios';

export const dynamic = 'force-dynamic';

/**
 * Dispara notificaciones de pedidos programados cuya ventana ya llegó
 * (scheduled_at dentro de los próximos 30 min, aún pendiente, sin notificar).
 * Protegido por CRON_SECRET o sesión admin.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const isCron =
    cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
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
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

  const { data: due, error } = await supabaseAdmin
    .from('moto_requests')
    .select('*')
    .eq('status', 'pendiente')
    .eq('when_type', 'programado')
    .is('scheduled_notified_at', null)
    .lte('scheduled_at', windowEnd.toISOString())
    .gte('scheduled_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString())
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let notified = 0;
  for (const row of due || []) {
    const req = row as MotoRequest;
    await notifyRidersNewRequest(req);
    await supabaseAdmin
      .from('moto_requests')
      .update({ scheduled_notified_at: new Date().toISOString() })
      .eq('id', req.id);
    notified += 1;
  }

  return NextResponse.json({ notified, scanned: due?.length || 0 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
