import { supabaseAdmin } from '@/lib/supabase-admin';
import { findConversationBetween } from '@/lib/profile/server';

const QUICK_REPLIES_RIDER = [
  'Estoy en camino al recojo',
  'Llego en 5 minutos',
  'Ya estoy en el punto de recojo',
  'Recogí el envío, voy al destino',
  'Llegué al destino',
] as const;

const QUICK_REPLIES_REQUESTER = [
  'Ok, te espero',
  'Estoy en el punto de recojo',
  '¿Cuánto te falta?',
  'Listo, ya salgo',
] as const;

export { QUICK_REPLIES_RIDER, QUICK_REPLIES_REQUESTER };

/** Crea o reutiliza chat entre remitente y motorizado al aceptar. */
export async function ensureDeliveryConversation(params: {
  requesterId: string;
  riderUserId: string;
  requestId: string;
  summary: string;
}): Promise<string | null> {
  const { requesterId, riderUserId, requestId, summary } = params;
  if (requesterId === riderUserId) return null;

  const existing = await findConversationBetween(requesterId, riderUserId);
  let conversationId = existing?.id as string | undefined;

  const intro = `✅ Pedido aceptado\n${summary}\n\nCoordina aquí en Buscadis — tu número no se publica. Cada viaje bien hecho suma a tu historial.`;

  if (!conversationId) {
    const participants = [requesterId, riderUserId].sort();
    const { data: created, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        participants,
        last_message: intro,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !created) {
      console.error('[delivery chat]', error?.message);
      return null;
    }
    conversationId = created.id;
  }

  await supabaseAdmin.from('messages').insert({
    conversation_id: conversationId,
    sender_id: riderUserId,
    content: intro,
    message_kind: 'system_seller',
    metadata: { kind: 'delivery_accepted', request_id: requestId },
  });

  await supabaseAdmin
    .from('moto_requests')
    .update({ conversation_id: conversationId })
    .eq('id', requestId);

  return conversationId ?? null;
}

export async function postDeliverySystemMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  kind: string;
  requestId: string;
}): Promise<void> {
  await supabaseAdmin.from('messages').insert({
    conversation_id: params.conversationId,
    sender_id: params.senderId,
    content: params.content,
    message_kind: 'system_seller',
    metadata: { kind: params.kind, request_id: params.requestId },
  });

  await supabaseAdmin
    .from('conversations')
    .update({
      last_message: params.content.slice(0, 120),
      last_message_at: new Date().toISOString(),
    })
    .eq('id', params.conversationId);
}

export async function postLocationMessage(params: {
  conversationId: string;
  senderId: string;
  lat: number;
  lng: number;
  label: string;
}): Promise<void> {
  const maps = `https://www.google.com/maps?q=${params.lat},${params.lng}`;
  await supabaseAdmin.from('messages').insert({
    conversation_id: params.conversationId,
    sender_id: params.senderId,
    content: `📍 ${params.label}\n${maps}`,
    message_kind: 'user',
    metadata: {
      kind: 'location',
      lat: params.lat,
      lng: params.lng,
    },
  });

  await supabaseAdmin
    .from('conversations')
    .update({
      last_message: `📍 ${params.label}`,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', params.conversationId);
}
