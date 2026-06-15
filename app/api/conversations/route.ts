import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { findConversationBetween } from '@/lib/profile/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bodySchema = z.object({
  recipientId: z.string().uuid(),
  storyId: z.string().uuid().optional(),
  adisoId: z.string().optional(),
  initialMessage: z.string().max(500).optional(),
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

    const { recipientId, storyId, adisoId, initialMessage } = parsed.data;

    if (recipientId === user.id) {
      return NextResponse.json({ error: 'No puedes chatear contigo mismo' }, { status: 400 });
    }

    const participants = [user.id, recipientId].sort();

    const existing = await findConversationBetween(user.id, recipientId);
    let conversationId = existing?.id as string | undefined;

    if (!conversationId) {
      const { data: created, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          participants,
          story_id: storyId || null,
          adiso_id: adisoId || null,
          last_message: initialMessage || null,
          last_message_at: initialMessage ? new Date().toISOString() : undefined,
        })
        .select('id')
        .single();

      if (error || !created) {
        return NextResponse.json({ error: 'No se pudo crear la conversación' }, { status: 500 });
      }
      conversationId = created.id;
    } else {
      const updates: Record<string, unknown> = {};
      if (storyId) updates.story_id = storyId;
      if (adisoId) updates.adiso_id = adisoId;
      if (Object.keys(updates).length > 0) {
        await supabaseAdmin.from('conversations').update(updates).eq('id', conversationId);
      }
    }

    if (initialMessage) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: initialMessage,
      });
    }

    return NextResponse.json({ conversationId });
  } catch (e) {
    console.error('[api/conversations POST]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
