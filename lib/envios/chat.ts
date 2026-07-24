import { supabaseAdmin } from '@/lib/supabase-admin';
import { findConversationBetween } from '@/lib/profile/server';

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

  const intro = `Delivery Buscadis: ${summary}`;

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
    metadata: { kind: 'delivery', request_id: requestId },
  });

  await supabaseAdmin
    .from('moto_requests')
    .update({ conversation_id: conversationId })
    .eq('id', requestId);

  return conversationId ?? null;
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
