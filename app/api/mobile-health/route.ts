import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function isAuthorized(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY?.trim();
  if (adminKey) {
    const header = request.headers.get('x-admin-api-key');
    if (header === adminKey) return true;
  }

  const pushSecret = process.env.MOBILE_PUSH_ADMIN_SECRET?.trim();
  if (pushSecret) {
    const auth = request.headers.get('authorization');
    if (auth === `Bearer ${pushSecret}`) return true;
  }

  const ingest = process.env.MOBILE_INGEST_SECRET?.trim();
  if (ingest && request.headers.get('x-mobile-ingest-secret') === ingest) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checks: Record<string, unknown> = {
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      mobileIngestSecret: Boolean(process.env.MOBILE_INGEST_SECRET),
      mobilePushAdminSecret: Boolean(process.env.MOBILE_PUSH_ADMIN_SECRET),
      expoAccessToken: Boolean(process.env.EXPO_ACCESS_TOKEN),
      supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      androidAppLinksSha256: Boolean(process.env.ANDROID_APP_LINKS_SHA256),
      androidAppPackageName:
        process.env.ANDROID_APP_PACKAGE_NAME?.trim() || 'com.adisplatforms.buscadis',
    },
  };

  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [analyticsRes, tokensRes, recentRes, linkedRes] = await Promise.all([
      supabaseAdmin.from('mobile_analytics_events').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('expo_push_tokens').select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('mobile_analytics_events')
        .select('id', { count: 'exact', head: true })
        .gte('received_at', since24h),
      supabaseAdmin
        .from('expo_push_tokens')
        .select('id', { count: 'exact', head: true })
        .not('user_id', 'is', null),
    ]);

    if (analyticsRes.error) {
      checks.ok = false;
      checks.analyticsError = analyticsRes.error.message;
    }
    if (tokensRes.error) {
      checks.ok = false;
      checks.pushTokensError = tokensRes.error.message;
    }

    checks.counts = {
      analyticsEventsTotal: analyticsRes.count ?? 0,
      analyticsEvents24h: recentRes.count ?? 0,
      pushTokensTotal: tokensRes.count ?? 0,
      pushTokensLinkedToUsers: linkedRes.count ?? 0,
    };
  } catch (e) {
    checks.ok = false;
    checks.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(checks, {
    status: checks.ok ? 200 : 503,
  });
}
