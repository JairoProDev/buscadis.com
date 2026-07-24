import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  ensureDeliveryConversation,
  notifyRequesterStatus,
  postLocationMessage,
  type MotoRequest,
} from '@/lib/envios';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
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
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
  }

  let rider = null;
  if (data.rider_id) {
    const { data: r } = await supabaseAdmin
      .from('moto_riders')
      .select(
        'id, user_id, display_name, telefono_whatsapp, placa, foto_perfil_url, foto_moto_url, rating_avg, rating_count, estado'
      )
      .eq('id', data.rider_id)
      .maybeSingle();
    rider = r;
  }

  const { data: reqProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, nombre, telefono, avatar_url')
    .eq('id', data.requester_id)
    .maybeSingle();

  const { data: rating } = await supabaseAdmin
    .from('moto_ratings')
    .select('*')
    .eq('request_id', id)
    .eq('from_user_id', user.id)
    .maybeSingle();

  return NextResponse.json({
    request: data,
    rider,
    requester: reqProfile,
    myRating: rating,
    conversationId: data.conversation_id || null,
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
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: {
    action?: string;
    cancel_reason?: string;
    lat?: number;
    lng?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const action = body.action;
  if (!action) {
    return NextResponse.json({ error: 'Acción requerida' }, { status: 400 });
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
  const isAssignedRider = !!(rider && current.rider_id === rider.id);

  if (action === 'cancel') {
    if (!isRequester && !isAssignedRider) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
    if (!['pendiente', 'aceptado', 'recogido'].includes(current.status)) {
      return NextResponse.json(
        { error: 'Este pedido ya no se puede cancelar' },
        { status: 400 }
      );
    }
    const reason =
      body.cancel_reason?.trim() ||
      (isRequester ? 'Cancelado por quien pidió' : 'Cancelado por el motorizado');

    const { data, error } = await supabaseAdmin
      .from('moto_requests')
      .update({
        status: 'cancelado',
        cancel_reason: reason,
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

    if (current.conversation_id) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: current.conversation_id,
        sender_id: user.id,
        content: `Pedido cancelado: ${reason}`,
        message_kind: 'user',
        metadata: { kind: 'delivery_cancel', request_id: id },
      });
    }

    if (isAssignedRider) {
      await notifyRequesterStatus(
        updated,
        'Pedido cancelado',
        'El motorizado canceló. Puedes crear otro pedido.'
      );
    } else if (rider?.user_id && current.rider_id) {
      const { data: assigned } = await supabaseAdmin
        .from('moto_riders')
        .select('user_id')
        .eq('id', current.rider_id)
        .maybeSingle();
      if (assigned?.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: assigned.user_id,
          type: 'system',
          title: 'Pedido cancelado',
          message: reason,
          data: { kind: 'moto_cancel', request_id: id },
        });
      }
    }

    return NextResponse.json({ request: updated });
  }

  if (action === 'accept') {
    if (!rider || rider.estado !== 'aprobado') {
      return NextResponse.json(
        { error: 'Debes ser motorizado aprobado' },
        { status: 403 }
      );
    }

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
        { error: 'Alguien más ya tomó este pedido' },
        { status: 409 }
      );
    }

    await supabaseAdmin
      .from('moto_riders')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', rider.id);

    const conversationId = await ensureDeliveryConversation({
      requesterId: data.requester_id,
      riderUserId: rider.user_id,
      requestId: id,
      summary: `${data.pickup_text} → ${data.dropoff_text}`,
    });

    const { data: refreshed } = await supabaseAdmin
      .from('moto_requests')
      .select('*')
      .eq('id', id)
      .single();

    const updated = (refreshed || data) as MotoRequest;
    await notifyRequesterStatus(
      updated,
      '¡Motorizado asignado!',
      `${rider.display_name || 'Un motorizado'} aceptó. Ábrele el chat en la app.`
    );
    return NextResponse.json({ request: updated, conversationId });
  }

  if (action === 'share_location') {
    if (!isRequester && !isAssignedRider) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
    if (!['aceptado', 'recogido'].includes(current.status)) {
      return NextResponse.json(
        { error: 'Solo puedes compartir ubicación con un pedido activo' },
        { status: 400 }
      );
    }
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Ubicación inválida' }, { status: 400 });
    }

    const patch = isAssignedRider
      ? {
          rider_lat: lat,
          rider_lng: lng,
          rider_location_at: new Date().toISOString(),
        }
      : {
          requester_lat: lat,
          requester_lng: lng,
          requester_location_at: new Date().toISOString(),
        };

    const { data, error } = await supabaseAdmin
      .from('moto_requests')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let conversationId = current.conversation_id as string | null;
    if (!conversationId && isAssignedRider && rider) {
      conversationId = await ensureDeliveryConversation({
        requesterId: current.requester_id,
        riderUserId: rider.user_id,
        requestId: id,
        summary: `${current.pickup_text} → ${current.dropoff_text}`,
      });
    }

    if (conversationId) {
      await postLocationMessage({
        conversationId,
        senderId: user.id,
        lat,
        lng,
        label: isAssignedRider ? 'Ubicación del motorizado' : 'Mi ubicación',
      });
    }

    return NextResponse.json({
      request: data,
      conversationId,
    });
  }

  if (action === 'recogido' || action === 'entregado') {
    if (!isAssignedRider) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
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
      action === 'recogido' ? 'En camino al destino' : '¡Entregado!',
      action === 'recogido'
        ? 'El motorizado ya recogió y va al destino. Puedes chatear en la app.'
        : 'Tu pedido fue entregado. Califica al motorizado.'
    );
    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
}
