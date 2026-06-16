import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { toggleFollowCreator } from '@/lib/deals/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const { creatorId } = await request.json();
    if (!creatorId || creatorId === user.id) {
      return NextResponse.json({ error: 'Creador inválido' }, { status: 400 });
    }

    const following = await toggleFollowCreator(user.id, creatorId);
    return NextResponse.json({ success: true, following });
  } catch (e) {
    console.error('[api/deals/follow]', e);
    return NextResponse.json({ error: 'Error al seguir' }, { status: 500 });
  }
}
