import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getConversationCounterpart, notifyChatParticipant } from '@/lib/chat/notify';

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(4000),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { conversationId, content } = parsed.data;
    const { otherUserId, adisoId } = await getConversationCounterpart(conversationId, user.id);

    if (!otherUserId) {
      return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    }

    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('participants')
      .eq('id', conversationId)
      .maybeSingle();

    const participants = Array.isArray(conv?.participants) ? (conv!.participants as string[]) : [];
    if (!participants.includes(user.id)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        read: false,
      })
      .select('*')
      .single();

    if (error || !message) {
      console.error('[conversations/send]', error?.message);
      return NextResponse.json({ error: 'No se pudo enviar el mensaje' }, { status: 500 });
    }

    await supabaseAdmin
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    const { data: senderProfile } = await supabaseAdmin
      .from('profiles')
      .select('nombre')
      .eq('id', user.id)
      .maybeSingle();

    const senderName = (senderProfile?.nombre as string) || 'Alguien';

    void notifyChatParticipant({
      recipientUserId: otherUserId,
      senderUserId: user.id,
      conversationId,
      title: `Mensaje de ${senderName}`,
      body: content,
      adisoId,
    });

    return NextResponse.json({ message });
  } catch (e) {
    console.error('[conversations/send]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
