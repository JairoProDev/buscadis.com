import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { estimateDistanceKm, estimateEtaMinutes } from '@/lib/envios';

export const dynamic = 'force-dynamic';

/** Seguimiento público por token — sin teléfonos ni PII sensible */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('moto_requests')
    .select(
      'status, pickup_text, dropoff_text, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, rider_lat, rider_lng, rider_id, distance_km, updated_at'
    )
    .eq('share_token', token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  let rider_name: string | null = null;
  let rider_placa: string | null = null;
  if (data.rider_id) {
    const { data: r } = await supabaseAdmin
      .from('moto_riders')
      .select('display_name, placa')
      .eq('id', data.rider_id)
      .maybeSingle();
    rider_name = r?.display_name || null;
    rider_placa = r?.placa || null;
  }

  let eta_minutes: number | null = null;
  if (data.rider_lat != null && data.rider_lng != null) {
    const targetLat =
      data.status === 'recogido' ? Number(data.dropoff_lat) : Number(data.pickup_lat);
    const targetLng =
      data.status === 'recogido' ? Number(data.dropoff_lng) : Number(data.pickup_lng);
    eta_minutes = estimateEtaMinutes(
      estimateDistanceKm(
        Number(data.rider_lat),
        Number(data.rider_lng),
        targetLat,
        targetLng
      )
    );
  } else if (data.status === 'pendiente' || data.status === 'aceptado') {
    eta_minutes = estimateEtaMinutes(Number(data.distance_km));
  }

  return NextResponse.json({
    trip: {
      status: data.status,
      pickup_text: data.pickup_text,
      dropoff_text: data.dropoff_text,
      rider_name,
      rider_placa,
      eta_minutes,
      rider_lat: data.rider_lat,
      rider_lng: data.rider_lng,
      updated_at: data.updated_at,
    },
  });
}
