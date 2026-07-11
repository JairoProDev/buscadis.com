import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const body = await request.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

    if (!businessId || !sessionId) {
      return NextResponse.json({ success: false, error: 'missing_params' }, { status: 400 });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'server_config' }, { status: 500 });
    }

    const userAgent = request.headers.get('user-agent') || body.userAgent || '';
    const referrer = body.referrer || request.headers.get('referer') || '';

    const { data, error } = await supabase.rpc('increment_business_profile_view', {
      p_business_id: businessId,
      p_session_id: sessionId,
      p_user_agent: userAgent,
      p_referrer: referrer,
    });

    if (error) {
      console.error('track-view rpc error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from('business_profiles')
      .select('view_count')
      .eq('id', businessId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      counted: Boolean(data),
      view_count: profile?.view_count ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('track-view error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
