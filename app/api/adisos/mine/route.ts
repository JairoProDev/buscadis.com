import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getUserAdisosServer } from '@/lib/profile/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100);
    const adisos = await getUserAdisosServer(user.id, limit);
    return NextResponse.json({ adisos });
  } catch (e) {
    console.error('[api/adisos/mine]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
