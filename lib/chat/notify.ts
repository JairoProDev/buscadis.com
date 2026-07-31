import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendPushToUser } from '@/lib/notifications/delivery';

/**
 * Notify a user about a new chat message (in-app + Expo push when registered).
 */
export async function notifyChatParticipant(params: {
  recipientUserId: string;
  senderUserId: string;
  conversationId: string;
  title: string;
  body: string;
  adisoId?: string | null;
}): Promise<{ inApp: boolean; push: boolean }> {
  const { recipientUserId, senderUserId, conversationId, title, body, adisoId } = params;

  if (!recipientUserId || recipientUserId === senderUserId) {
    return { inApp: false, push: false };
  }

  const data = {
    conversation_id: conversationId,
    sender_id: senderUserId,
    ...(adisoId ? { adiso_id: adisoId } : {}),
  };

  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: recipientUserId,
    type: 'message',
    title: title.slice(0, 200),
    message: body.slice(0, 2000),
    data,
    read: false,
  });

  if (error) {
    console.error('[notifyChatParticipant] in-app', error.message);
  }

  const push = await sendPushToUser(recipientUserId, title, body, data).catch(() => false);

  return { inApp: !error, push };
}

export async function getConversationCounterpart(
  conversationId: string,
  senderUserId: string
): Promise<{ otherUserId: string | null; adisoId: string | null }> {
  const { data } = await supabaseAdmin
    .from('conversations')
    .select('participants, adiso_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (!data) return { otherUserId: null, adisoId: null };

  const participants = Array.isArray(data.participants) ? (data.participants as string[]) : [];
  const otherUserId = participants.find((id) => id && id !== senderUserId) || null;

  return {
    otherUserId,
    adisoId: (data.adiso_id as string) || null,
  };
}
