import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const RETENTION_DAYS = 30;

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
    const { data, error } = await supabaseAdmin.rpc('purge_expired_trash', {
      retention_days: RETENTION_DAYS,
    });
    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      ok: true,
      retentionDays: RETENTION_DAYS,
      catalogProductsPurged: row?.catalog_products_purged ?? 0,
      adisosPurged: row?.adisos_purged ?? 0,
    });
  } catch (e) {
    console.error('[cron/purge-trash]', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
