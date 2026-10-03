import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getAdisoMetricsForUser } from '@/lib/analytics/adiso-metrics';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const daysParam = request.nextUrl.searchParams.get('days');
  const days = daysParam === '7' ? 7 : 30;

  try {
    const summary = await getAdisoMetricsForUser(user.id, days);
    return NextResponse.json({ success: true, ...summary });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
