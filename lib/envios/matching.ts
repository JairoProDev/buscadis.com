import { supabaseAdmin } from '@/lib/supabase-admin';
import type { MotoRider } from './types';

/**
 * Riders aprobados elegibles para una solicitud en una zona.
 * Prefer online; incluye offline recientes como fallback de notificación.
 */
export async function findEligibleRiders(params: {
  zona: string | null;
  mandadoCompra?: boolean;
  onlineOnly?: boolean;
}): Promise<MotoRider[]> {
  let query = supabaseAdmin
    .from('moto_riders')
    .select('*')
    .eq('estado', 'aprobado');

  if (params.onlineOnly) {
    query = query.eq('online', true);
  }

  if (params.mandadoCompra) {
    query = query.eq('acepta_mandados_compra', true);
  }

  const { data, error } = await query.order('last_seen_at', {
    ascending: false,
    nullsFirst: false,
  });

  if (error || !data) {
    console.error('[envios/matching]', error?.message);
    return [];
  }

  const riders = data as MotoRider[];
  if (!params.zona) return riders;

  const zonaNorm = params.zona.toLowerCase();
  const inZone = riders.filter((r) =>
    (r.zonas || []).some((z) => z.toLowerCase() === zonaNorm)
  );

  // Si nadie cubre la zona exacta, notificar a todos aprobados (cobertura inicial)
  return inZone.length > 0 ? inZone : riders;
}

export async function getApprovedRiderByUserId(
  userId: string
): Promise<MotoRider | null> {
  const { data } = await supabaseAdmin
    .from('moto_riders')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as MotoRider) || null;
}
