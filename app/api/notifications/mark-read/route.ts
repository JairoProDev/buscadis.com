import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = (await request.json()) as { all?: boolean; ids?: string[] };

    if (body.all) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
    } else if (body.ids?.length) {
      await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', body.ids);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[api/notifications/mark-read]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
