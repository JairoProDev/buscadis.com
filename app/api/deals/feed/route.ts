import { NextRequest, NextResponse } from 'next/server';
import { buildDealFeed } from '@/lib/deals/feed';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getLiveSessionsServer } from '@/lib/deals/server';
import { DealFeedTab } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const tab = (sp.get('tab') as DealFeedTab) || 'for_you';
    const cursor = sp.get('cursor') || undefined;
    const categoria = sp.get('categoria') || undefined;
    const clipId = sp.get('clip') || undefined;
    const sessionId = sp.get('sessionId') || request.headers.get('x-session-id') || undefined;

    const user = await getUserFromRouteRequest(request);

    const [{ clips, nextCursor }, liveSessions] = await Promise.all([
      buildDealFeed({
        tab,
        cursor,
        categoria,
        clipId,
        userId: user?.id,
        sessionId: sessionId || undefined,
      }),
      getLiveSessionsServer(),
    ]);

    return NextResponse.json({
      clips,
      nextCursor,
      liveSessions,
    });
  } catch (e) {
    console.error('[api/deals/feed GET]', e);
    return NextResponse.json({ error: 'Error al cargar Deals' }, { status: 500 });
  }
}
