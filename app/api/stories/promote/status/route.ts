import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getStoryOrderById } from '@/lib/stories/promotions';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    const order = await getStoryOrderById(orderId);
    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const { data: story } = await supabaseAdmin
      .from('stories')
      .select('id, status, promotion_tier, visible_until')
      .eq('id', order.story_id)
      .maybeSingle();

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      fulfilled: Boolean(order.fulfilled_at),
      tier: order.tier,
      story,
    });
  } catch (e) {
    console.error('[api/stories/promote/status]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
