import { supabaseAdmin } from '@/lib/supabase-admin';

const VIEW_TTL_MS = 45_000;

/** Rider heartbeat: estoy mirando este pedido pendiente */
export async function recordRequestView(
  requestId: string,
  riderId: string
): Promise<void> {
  await supabaseAdmin.from('moto_request_views').upsert(
    {
      request_id: requestId,
      rider_id: riderId,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'request_id,rider_id' }
  );
}

/** Cuántos riders miraron el pedido en los últimos ~45s */
export async function countActiveViewers(requestId: string): Promise<number> {
  const since = new Date(Date.now() - VIEW_TTL_MS).toISOString();
  const { count, error } = await supabaseAdmin
    .from('moto_request_views')
    .select('*', { count: 'exact', head: true })
    .eq('request_id', requestId)
    .gte('last_seen_at', since);

  if (error) {
    console.error('[envios viewers]', error.message);
    return 0;
  }
  return count || 0;
}

/** Marca vistas de todos los disponibles que el rider está viendo en el feed */
export async function recordFeedViews(
  riderId: string,
  requestIds: string[]
): Promise<void> {
  if (requestIds.length === 0) return;
  const now = new Date().toISOString();
  await supabaseAdmin.from('moto_request_views').upsert(
    requestIds.map((request_id) => ({
      request_id,
      rider_id: riderId,
      last_seen_at: now,
    })),
    { onConflict: 'request_id,rider_id' }
  );
}
