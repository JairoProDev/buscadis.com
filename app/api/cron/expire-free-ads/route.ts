import { NextRequest, NextResponse } from 'next/server';
import { expireFreeAds } from '@/lib/publish/expire-free';

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
    const result = await expireFreeAds();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron/expire-free-ads]', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
