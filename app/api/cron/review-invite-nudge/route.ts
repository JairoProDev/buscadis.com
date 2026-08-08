import { NextRequest, NextResponse } from 'next/server';
import { runReviewInviteNudges } from '@/lib/business/review-invite-cron';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

/** Diario: nudges al dueño ~48h después de clics WA sin reseña nueva. */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runReviewInviteNudges();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron/review-invite-nudge]', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
