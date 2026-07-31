import { supabaseAdmin } from '@/lib/supabase-admin';
import { findConversationBetween } from '@/lib/profile/server';
import { fieldQuestion } from './field-reveal';
import { notifyChatParticipant } from '@/lib/chat/notify';

export interface OpenInteractionResult {
  sessionId: string;
  conversationId: string;
  isNew: boolean;
  revealedFields: string[];
  photoIndexSeen: number;
}

export async function openAdInteraction(params: {
  viewerUserId: string;
  adisoId: string;
  adisoTitle: string;
  sellerUserId: string;
  /** When true, notify seller about the greeting. Default false (warm/open should not spam). */
  notifySeller?: boolean;
}): Promise<OpenInteractionResult> {
  const { viewerUserId, adisoId, adisoTitle, sellerUserId, notifySeller = false } = params;

  const { data: existingSession } = await supabaseAdmin
    .from('ad_interaction_sessions')
    .select('*')
    .eq('user_id', viewerUserId)
    .eq('adiso_id', adisoId)
    .maybeSingle();

  if (existingSession?.conversation_id) {
    return {
      sessionId: existingSession.id as string,
      conversationId: existingSession.conversation_id as string,
      isNew: false,
      revealedFields: (existingSession.revealed_fields as string[]) || [],
      photoIndexSeen: (existingSession.photo_index_seen as number) || 0,
    };
  }

  const initialMessage = `Hola, vi tu aviso "${adisoTitle}" y me interesa saber más.`;

  let conversationId: string | undefined;

  // Prefer an existing conversation for THIS listing (avoid mixing iPad with empleos chat)
  const { data: existingForAd } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('adiso_id', adisoId)
    .contains('participants', [viewerUserId, sellerUserId])
    .maybeSingle();

  if (existingForAd?.id) {
    conversationId = existingForAd.id as string;
  } else {
    const existingConv = await findConversationBetween(viewerUserId, sellerUserId);
    // Only reuse if it has no adiso yet or already points at this one
    if (existingConv && (!existingConv.adiso_id || existingConv.adiso_id === adisoId)) {
      conversationId = existingConv.id as string;
      await supabaseAdmin
        .from('conversations')
        .update({ adiso_id: adisoId })
        .eq('id', conversationId);
    }
  }

  if (!conversationId) {
    const participants = [viewerUserId, sellerUserId].sort();
    const { data: created } = await supabaseAdmin
      .from('conversations')
      .insert({
        participants,
        adiso_id: adisoId,
        last_message: initialMessage,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    conversationId = created?.id as string;
  }

  if (!conversationId) {
    throw new Error('No se pudo crear la conversación');
  }

  // Only seed the greeting when this listing session is brand new
  const isBrandNewSession = !existingSession;
  if (isBrandNewSession) {
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      sender_id: viewerUserId,
      content: initialMessage,
      message_kind: 'system_buyer',
      metadata: { adiso_id: adisoId, auto: true },
    });

    await supabaseAdmin
      .from('conversations')
      .update({
        last_message: initialMessage,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (notifySeller) {
      void notifyChatParticipant({
        recipientUserId: sellerUserId,
        senderUserId: viewerUserId,
        conversationId,
        title: `Alguien te escribió por "${adisoTitle}"`,
        body: initialMessage,
        adisoId,
      });
    }
  }

  const { data: session, error } = await supabaseAdmin
    .from('ad_interaction_sessions')
    .upsert(
      {
        user_id: viewerUserId,
        adiso_id: adisoId,
        conversation_id: conversationId,
        auto_opened_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,adiso_id' }
    )
    .select('*')
    .single();

  if (error || !session) {
    throw new Error('No se pudo crear sesión de interacción');
  }

  return {
    sessionId: session.id as string,
    conversationId,
    isNew: true,
    revealedFields: [],
    photoIndexSeen: 0,
  };
}

export async function getInteractionSession(viewerUserId: string, adisoId: string) {
  const { data } = await supabaseAdmin
    .from('ad_interaction_sessions')
    .select('*')
    .eq('user_id', viewerUserId)
    .eq('adiso_id', adisoId)
    .maybeSingle();
  return data;
}

export async function updateRevealedFields(
  sessionId: string,
  revealedFields: string[],
  photoIndexSeen?: number
): Promise<void> {
  const updates: Record<string, unknown> = {
    revealed_fields: revealedFields,
    updated_at: new Date().toISOString(),
  };
  if (photoIndexSeen != null) updates.photo_index_seen = photoIndexSeen;

  await supabaseAdmin.from('ad_interaction_sessions').update(updates).eq('id', sessionId);
}

export { fieldQuestion };
