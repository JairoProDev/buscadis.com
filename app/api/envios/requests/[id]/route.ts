import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyRequesterStatus, type MotoRequest } from '@/lib/envios';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  const { data, error } = await supabaseAdmin
    .from('moto_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const { data: riderProfile } = await supabaseAdmin
    .from('moto_riders')
    .select('id, user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const isParty =
    data.requester_id === user.id ||
    (riderProfile && data.rider_id === riderProfile.id) ||
    (data.status === 'pendiente' && riderProfile);

  if (!isParty) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.rol !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  let rider = null;
  if (data.rider_id) {
    const { data: r } = await supabaseAdmin
      .from('moto_riders')
      .select(
        'id, display_name, telefono_whatsapp, placa, foto_perfil_url, foto_moto_url, rating_avg, rating_count, estado'
      )
      .eq('id', data.rider_id)
      .maybeSingle();
    rider = r;
  }

  let requester = null;
  const { data: reqProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, nombre, telefono, avatar_url')
    .eq('id', data.requester_id)
    .maybeSingle();
  requester = reqProfile;

  const { data: rating } = await supabaseAdmin
    .from('moto_ratings')
    .select('*')
    .eq('request_id', id)
    .eq('from_user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    request: data,
    rider,
    requester,
    myRating: rating,
    role:
      data.requester_id === user.id
        ? 'requester'
        : riderProfile && data.rider_id === riderProfile.id
          ? 'rider'
          : 'other',
  });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: {
    action?: string;
    cancel_reason?: string;
    tip_amount?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const action = body.action;
  if (!action) {
    return NextResponse.json({ error: 'action requerida' }, { status: 400 });
  }

  const { data: current } = await supabaseAdmin
    .from('moto_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!current) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const { data: rider } = await supabaseAdmin
    .from('moto_riders')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const isRequester = current.requester_id === user.id;
  const isAssignedRider = rider && current.rider_id === rider.id;

  if (action === 'cancel') {
    if (!isRequester && !isAssignedRider) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!['pendiente', 'aceptado'].includes(current.status)) {
      return NextResponse.json({ error: 'No se puede cancelar' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('moto_requests')
      .update({
        status: 'cancelado',
        cancel_reason: body.cancel_reason || null,
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updated = data as MotoRequest;
    if (isAssignedRider) {
      await notifyRequesterStatus(
        updated,
        'Envío cancelado',
        'El motorizado canceló. Puedes crear otra solicitud.'
      );
    }
    return NextResponse.json({ request: updated });
  }

  if (action === 'accept') {
    if (!rider || rider.estado !== 'aprobado') {
      return NextResponse.json({ error: 'Rider no aprobado' }, { status: 403 });
    }

    // Claim atómico vía UPDATE condicional (service role; no depende de auth.uid())
    const { data, error } = await supabaseAdmin
      .from('moto_requests')
      .update({
        status: 'aceptado',
        rider_id: rider.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pendiente')
      .select('*')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json(
        { error: 'Alguien más ya tomó este envío' },
        { status: 409 }
      );
    }

    await supabaseAdmin
      .from('moto_riders')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', rider.id);

    const updated = data as MotoRequest;
    await notifyRequesterStatus(
      updated,
      '¡Motorizado en camino!',
      `${rider.display_name || 'Un motorizado'} aceptó tu envío.`
    );
    return NextResponse.json({ request: updated });
  }

  if (action === 'recogido' || action === 'entregado') {
    if (!isAssignedRider) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'recogido' && current.status !== 'aceptado') {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }
    if (action === 'entregado' && current.status !== 'recogido') {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const patch =
      action === 'recogido'
        ? { status: 'recogido', picked_up_at: new Date().toISOString() }
        : { status: 'entregado', delivered_at: new Date().toISOString() };

    const { data, error } = await supabaseAdmin
      .from('moto_requests')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updated = data as MotoRequest;
    await notifyRequesterStatus(
      updated,
      action === 'recogido' ? 'Paquete recogido' : '¡Entregado!',
      action === 'recogido'
        ? 'El motorizado recogió tu envío y va al destino.'
        : 'Tu envío fue entregado. ¿Cómo te fue? Califica al motorizado.'
    );
    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: 'action desconocida' }, { status: 400 });
}
