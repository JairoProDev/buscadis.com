import { NextRequest, NextResponse } from 'next/server';
import { activateScheduledRuedaAds } from '@/lib/rueda/go-live';

/**
 * Activación manual / cron externo (p. ej. cron-job.org cada minuto).
 * Header: Authorization: Bearer CRON_SECRET
 * Query: limit=1..80 (default 1)
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const limitRaw = request.nextUrl.searchParams.get('limit');
    const limit = Math.min(80, Math.max(1, parseInt(limitRaw || '1', 10) || 1));
    const result = await activateScheduledRuedaAds(limit);
    return NextResponse.json({ ok: true, limit, ...result });
  } catch (e) {
    console.error('[api/rueda/go-live]', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
