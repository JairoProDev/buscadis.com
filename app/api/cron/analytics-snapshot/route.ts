import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('refresh_adiso_metrics_daily');
    if (error) {
      if (error.message?.includes('refresh_adiso_metrics_daily')) {
        return NextResponse.json(
          { ok: false, hint: 'Apply migration 055_analytics_rollups.sql' },
          { status: 503 }
        );
      }
      throw error;
    }
    return NextResponse.json({ ok: true, rowsUpserted: data ?? 0 });
  } catch (e) {
    console.error('[cron/analytics-snapshot]', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 120;
