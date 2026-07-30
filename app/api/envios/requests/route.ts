import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  MOTO_CATEGORIES,
  detectUso,
  detectZoneFromText,
  estimateDistanceKm,
  estimateFare,
  notifyRidersNewRequest,
  recordFeedViews,
  type CreateMotoRequestInput,
  type MotoCategory,
  type MotoRequest,
} from '@/lib/envios';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  const scope = request.nextUrl.searchParams.get('scope') || 'mine';
  const status = request.nextUrl.searchParams.get('status');

  if (scope === 'available') {
    const { data: rider } = await supabaseAdmin
      .from('moto_riders')
      .select('*')
      .eq('user_id', user.id)
      .eq('estado', 'aprobado')
      .maybeSingle();

    if (!rider) {
      return NextResponse.json({ error: 'Aún no eres motorizado aprobado' }, { status: 403 });
    }

    let q = supabaseAdmin
      .from('moto_requests')
      .select('*')
      .eq('status', 'pendiente')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const zonas: string[] = rider.zonas || [];
    const filtered =
      zonas.length === 0
        ? data || []
        : (data || []).filter(
            (r) =>
              !r.pickup_zona ||
              zonas.some((z) => z.toLowerCase() === String(r.pickup_zona).toLowerCase())
          );

    // Si filtro vacío, devolver todas pendientes (cobertura inicial)
    const list = filtered.length > 0 ? filtered : data || [];
    void recordFeedViews(
      rider.id,
      list.map((r: { id: string }) => r.id)
    );
    return NextResponse.json({
      requests: list,
      rider,
    });
  }

  // mine (requester) + assigned as rider
  const { data: rider } = await supabaseAdmin
    .from('moto_riders')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let q = supabaseAdmin
    .from('moto_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(40);

  if (rider?.id) {
    q = q.or(`requester_id.eq.${user.id},rider_id.eq.${rider.id}`);
  } else {
    q = q.eq('requester_id', user.id);
  }

  if (status) {
    q = q.eq('status', status);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  let body: CreateMotoRequestInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const category = body.category as MotoCategory;
  if (!MOTO_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 });
  }

  const contactName = (body.contact_name || '').trim();
  const rawDescription = (body.description || '').trim();
  if (rawDescription.length < 3) {
    return NextResponse.json(
      { error: 'Describe qué vas a enviar (mínimo unas palabras)' },
      { status: 400 }
    );
  }
  const description = contactName
    ? `${contactName} · ${rawDescription}`
    : rawDescription;

  if (!body.pickup?.lat || !body.pickup?.lng || !body.dropoff?.lat || !body.dropoff?.lng) {
    return NextResponse.json({ error: 'Recojo y destino son obligatorios' }, { status: 400 });
  }

  if (body.when_type === 'programado' && !body.scheduled_at) {
    return NextResponse.json({ error: 'Indica fecha y hora programada' }, { status: 400 });
  }

  const pickupText = (body.pickup.text || '').trim() || 'Punto de recojo';
  const dropoffText = (body.dropoff.text || '').trim() || 'Punto de entrega';
  const pickupZona =
    body.pickup.zona ||
    detectZoneFromText(pickupText) ||
    null;
  const dropoffZona =
    body.dropoff.zona ||
    detectZoneFromText(dropoffText) ||
    null;

  const distanceKm = estimateDistanceKm(
    body.pickup.lat,
    body.pickup.lng,
    body.dropoff.lat,
    body.dropoff.lng
  );
  const fareEstimate = estimateFare(distanceKm);
  const usoDetectado = detectUso(category, description);

  const row = {
    requester_id: user.id,
    category,
    description,
    photo_url: body.photo_url || null,
    pickup_lat: body.pickup.lat,
    pickup_lng: body.pickup.lng,
    pickup_text: pickupText,
    pickup_zona: pickupZona,
    dropoff_lat: body.dropoff.lat,
    dropoff_lng: body.dropoff.lng,
    dropoff_text: dropoffText,
    dropoff_zona: dropoffZona,
    when_type: body.when_type === 'programado' ? 'programado' : 'ahora',
    scheduled_at: body.when_type === 'programado' ? body.scheduled_at : null,
    budget_estimate:
      category === 'mandado' && body.budget_estimate != null
        ? Number(body.budget_estimate)
        : null,
    distance_km: distanceKm,
    fare_estimate: fareEstimate,
    tip_amount: body.tip_amount != null ? Number(body.tip_amount) : null,
    status: 'pendiente',
    uso_detectado: usoDetectado,
    source_adiso_id: body.source_adiso_id || null,
  };

  const { data, error } = await supabaseAdmin
    .from('moto_requests')
    .insert(row)
    .select('*')
    .single();

  if (error || !data) {
    console.error('[envios/requests POST]', error);
    return NextResponse.json(
      { error: error?.message || 'No se pudo crear la solicitud' },
      { status: 500 }
    );
  }

  const requestRow = data as MotoRequest;

  // Programados lejanos: no notificar aún (cron /api/envios/cron/scheduled)
  const isImmediate =
    requestRow.when_type === 'ahora' ||
    (requestRow.scheduled_at &&
      new Date(requestRow.scheduled_at).getTime() - Date.now() < 45 * 60 * 1000);

  if (isImmediate) {
    if (requestRow.when_type === 'programado') {
      await supabaseAdmin
        .from('moto_requests')
        .update({ scheduled_notified_at: new Date().toISOString() })
        .eq('id', requestRow.id);
    }
    void notifyRidersNewRequest(requestRow).catch((e) =>
      console.error('[envios notify]', e)
    );
  }

  return NextResponse.json({ request: requestRow }, { status: 201 });
}
