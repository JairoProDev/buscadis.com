import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';

const EXPO_TOKEN_PREFIX = 'ExponentPushToken[';

function checkIngestSecret(request: NextRequest): boolean {
  const secret = process.env.MOBILE_INGEST_SECRET;
  if (!secret) {
    return true;
  }
  return request.headers.get('x-mobile-ingest-secret') === secret;
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (checkIngestSecret(request)) {
    return true;
  }
  const authUser = await getUserFromRouteRequest(request);
  return Boolean(authUser?.id);
}

function isValidExpoPushToken(token: string): boolean {
  return (
    token.startsWith(EXPO_TOKEN_PREFIX) &&
    token.endsWith(']') &&
    token.length > EXPO_TOKEN_PREFIX.length + 2
  );
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!isValidExpoPushToken(token)) {
      return NextResponse.json({ error: 'Invalid Expo push token' }, { status: 400 });
    }

    const platform = typeof body.platform === 'string' ? body.platform.slice(0, 32) : null;
    const appVersion =
      typeof body.appVersion === 'string' ? body.appVersion.slice(0, 64) : null;

    const authUser = await getUserFromRouteRequest(request);
    const explicitUserId =
      body.userId === null
        ? null
        : typeof body.userId === 'string'
          ? body.userId.trim()
          : null;
    const userId = authUser?.id || explicitUserId || null;

    const { error } = await supabaseAdmin.from('expo_push_tokens').upsert(
      {
        expo_push_token: token,
        platform,
        app_version: appVersion,
        user_id: userId,
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'expo_push_token' }
    );

    if (error) {
      console.error('[mobile-push/register] upsert error:', error.message);
      return NextResponse.json({ error: 'Storage failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json(
        { error: 'Server not configured for push registry' },
        { status: 503 }
      );
    }
    console.error('[mobile-push/register]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
