import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { nanoid } from 'nanoid';
import {
  countActiveViewers,
  ensureDeliveryConversation,
  estimateDistanceKm,
  estimateEtaMinutes,
  notifyRequesterStatus,
  postDeliverySystemMessage,
  postLocationMessage,
  recordRequestView,
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

  // Presence: rider mirando pedido pendiente
  if (data.status === 'pendiente' && riderProfile?.id) {
    void recordRequestView(id, riderProfile.id);
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

  // Historial básico del remitente (sin teléfono expuesto en conteo)
  const { count: requesterCompleted } = await supabaseAdmin
    .from('moto_requests')
    .select('*', { count: 'exact', head: true })
    .eq('requester_id', data.requester_id)
    .eq('status', 'entregado');

  const { data: rating } = await supabaseAdmin
    .from('moto_ratings')
    .select('*')
    .eq('request_id', id)
    .eq('from_user_id', user.id)
    .maybeSingle();

  const viewers =
    data.status === 'pendiente' ? await countActiveViewers(id) : 0;

  let etaMinutes: number | null = null;
  if (
    data.status === 'aceptado' &&
    data.rider_lat != null &&
    data.rider_lng != null
  ) {
    const km = estimateDistanceKm(
      Number(data.rider_lat),
      Number(data.rider_lng),
      Number(data.pickup_lat),
      Number(data.pickup_lng)
    );
    etaMinutes = estimateEtaMinutes(km);
  } else if (
    data.status === 'recogido' &&
    data.rider_lat != null &&
    data.rider_lng != null
  ) {
    const km = estimateDistanceKm(
      Number(data.rider_lat),
      Number(data.rider_lng),
      Number(data.dropoff_lat),
      Number(data.dropoff_lng)
    );
    etaMinutes = estimateEtaMinutes(km);
  } else if (data.status === 'pendiente' || data.status === 'aceptado') {
    etaMinutes = estimateEtaMinutes(Number(data.distance_km));
  }

  const role =
    data.requester_id === user.id
      ? 'requester'
      : riderProfile && data.rider_id === riderProfile.id
        ? 'rider'
        : 'other';

  // Teléfono solo si ambas partes ya eligieron compartirlo
  const phoneShared = !!data.phone_shared_at;
  const requesterSafe = reqProfile
    ? {
        id: reqProfile.id,
        nombre: reqProfile.nombre,
        avatar_url: reqProfile.avatar_url,
        telefono: phoneShared ? reqProfile.telefono : null,
        completed_count: requesterCompleted || 0,
      }
    : null;

  const riderSafe = rider
    ? {
        ...rider,
        telefono_whatsapp: phoneShared ? rider.telefono_whatsapp : null,
        verified: rider.estado === 'aprobado',
      }
    : null;

  return NextResponse.json({
    request: data,
    rider: riderSafe,
    requester: requesterSafe,
    myRating: rating,
    conversationId: data.conversation_id || null,
    viewers,
    etaMinutes,
    phoneShared,
    role,
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
    fare_agreed?: number;
    tip_amount?: number;
    evidence_url?: string;
    message?: string;
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
      await postDeliverySystemMessage({
        conversationId: current.conversation_id,
        senderId: user.id,
        content: `Pedido cancelado: ${reason}`,
        kind: 'delivery_cancel',
        requestId: id,
      });
    }

    if (isAssignedRider) {
      await notifyRequesterStatus(
        updated,
        'Pedido cancelado',
        'El motorizado canceló. Puedes crear otro pedido.'
      );
    } else if (current.rider_id) {
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

    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      'accept_moto_request_service',
      { p_request_id: id, p_rider_id: rider.id }
    );

    if (rpcError) {
      const msg = rpcError.message || '';
      if (msg.includes('request_not_available')) {
        return NextResponse.json(
          {
            error:
              'Otro motorizado ya tomó este pedido. Mira los disponibles — hay más envíos.',
            code: 'taken',
          },
          { status: 409 }
        );
      }
      if (msg.includes('rider_not_eligible')) {
        return NextResponse.json(
          { error: 'Debes ser motorizado aprobado' },
          { status: 403 }
        );
      }
      // Fallback si la RPC aún no está migrada
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
          {
            error:
              'Otro motorizado ya tomó este pedido. Mira los disponibles — hay más envíos.',
            code: 'taken',
          },
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
        `${rider.display_name || 'Un motorizado'} aceptó. Coordina por el chat de la app.`
      );
      return NextResponse.json({ request: updated, conversationId });
    }

    const data = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as MotoRequest;

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
      `${rider.display_name || 'Un motorizado'} aceptó. Coordina por el chat de la app.`
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

  if (action === 'heartbeat_location') {
    if (!isAssignedRider) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
    if (!['aceptado', 'recogido'].includes(current.status)) {
      return NextResponse.json({ error: 'Pedido no activo' }, { status: 400 });
    }
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Ubicación inválida' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('moto_requests')
      .update({
        rider_lat: lat,
        rider_lng: lng,
        rider_location_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ request: data });
  }

  if (action === 'quick_reply') {
    if (!isRequester && !isAssignedRider) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
    const msg = (body.message || '').trim();
    if (!msg || msg.length > 200) {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 });
    }
    let conversationId = current.conversation_id as string | null;
    if (!conversationId && rider) {
      conversationId = await ensureDeliveryConversation({
        requesterId: current.requester_id,
        riderUserId: isAssignedRider ? rider.user_id : current.requester_id,
        requestId: id,
        summary: `${current.pickup_text} → ${current.dropoff_text}`,
      });
    }
    if (!conversationId) {
      return NextResponse.json({ error: 'Sin chat aún' }, { status: 400 });
    }
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: msg,
      message_kind: 'user',
      metadata: { kind: 'delivery_quick_reply', request_id: id },
    });
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message: msg,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
    return NextResponse.json({ ok: true, conversationId });
  }

  if (action === 'share_phone') {
    if (!isRequester && !isAssignedRider) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
    if (!['aceptado', 'recogido', 'entregado'].includes(current.status)) {
      return NextResponse.json({ error: 'Pedido no activo' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('moto_requests')
      .update({ phone_shared_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (current.conversation_id) {
      await postDeliverySystemMessage({
        conversationId: current.conversation_id,
        senderId: user.id,
        content:
          'Ambos eligieron compartir número. Úsalo solo si lo necesitan — el chat de la app sigue sumando a tu historial.',
        kind: 'delivery_phone_shared',
        requestId: id,
      });
    }
    return NextResponse.json({ request: data, phoneShared: true });
  }

  if (action === 'set_fare_agreed') {
    if (!isRequester && !isAssignedRider) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
    const fare = Number(body.fare_agreed);
    if (!Number.isFinite(fare) || fare < 0 || fare > 500) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('moto_requests')
      .update({ fare_agreed: fare })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (current.conversation_id) {
      await postDeliverySystemMessage({
        conversationId: current.conversation_id,
        senderId: user.id,
        content: `Tarifa acordada: S/${fare.toFixed(2)}`,
        kind: 'delivery_fare_agreed',
        requestId: id,
      });
    }
    return NextResponse.json({ request: data });
  }

  if (action === 'set_tip') {
    if (!isRequester) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
    const tip = Number(body.tip_amount);
    if (!Number.isFinite(tip) || tip < 0 || tip > 200) {
      return NextResponse.json({ error: 'Propina inválida' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('moto_requests')
      .update({ tip_amount: tip })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ request: data });
  }

  if (action === 'ensure_share_token') {
    if (!isRequester && !isAssignedRider) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }
    let token = current.share_token as string | null;
    if (!token) {
      token = nanoid(12);
      await supabaseAdmin
        .from('moto_requests')
        .update({ share_token: token })
        .eq('id', id);
    }
    return NextResponse.json({
      shareUrl: `/delivery/seguir/${token}`,
      shareToken: token,
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

    const evidence = body.evidence_url?.trim() || null;
    const patch =
      action === 'recogido'
        ? {
            status: 'recogido',
            picked_up_at: new Date().toISOString(),
            ...(evidence ? { evidence_pickup_url: evidence } : {}),
          }
        : {
            status: 'entregado',
            delivered_at: new Date().toISOString(),
            ...(evidence ? { evidence_delivery_url: evidence } : {}),
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

    const updated = data as MotoRequest;

    if (current.conversation_id) {
      await postDeliverySystemMessage({
        conversationId: current.conversation_id,
        senderId: user.id,
        content:
          action === 'recogido'
            ? '📦 Envío recogido — en camino al destino'
            : '✅ Entregado. ¡Gracias! Puedes calificar al motorizado.',
        kind: action === 'recogido' ? 'delivery_picked_up' : 'delivery_delivered',
        requestId: id,
      });
    }

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
