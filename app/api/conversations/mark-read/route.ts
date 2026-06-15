import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { conversationId } = (await request.json()) as { conversationId?: string };
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId requerido' }, { status: 400 });
    }

    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('participants')
      .eq('id', conversationId)
      .maybeSingle();

    if (!conv?.participants?.includes(user.id)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await supabaseAdmin
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('read', false)
      .neq('sender_id', user.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[api/conversations/mark-read]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
