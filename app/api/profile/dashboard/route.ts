import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getProfileDashboardStats } from '@/lib/profile/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const stats = await getProfileDashboardStats(user.id);
    return NextResponse.json({ stats });
  } catch (e) {
    console.error('[api/profile/dashboard]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
