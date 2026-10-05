import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { isPlatformAdminUser } from '@/lib/platform-admin';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('rol, is_platform_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!isPlatformAdminUser(user.email, profile)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [
    { count: eventsCount },
    { count: profilesCount },
    { count: intentsCount },
    { count: campaignsCount },
    { count: packageOrdersPaid },
    { count: connectedMatches },
    { data: demandByCategory },
    { data: recentInferences },
    { data: deliveryStats },
    { data: funnelDays },
    { data: zeroSearches },
    { count: mobileEvents24h },
  ] = await Promise.all([
    supabaseAdmin.from('behavioral_events').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('user_behavior_profiles').select('user_id', { count: 'exact', head: true }),
    supabaseAdmin.from('demand_intents').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('notification_campaigns').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('adiso_package_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['paid', 'dev_bypass']),
    supabaseAdmin
      .from('supply_demand_matches')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'connected'),
    supabaseAdmin.from('demand_intents').select('categoria').eq('status', 'active'),
    supabaseAdmin
      .from('inference_log')
      .select('inference_type, confidence, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin.from('campaign_deliveries').select('channel, status'),
    supabaseAdmin.from('v_personalization_funnel_7d').select('*').limit(7),
    supabaseAdmin.from('v_search_zero_results_7d').select('query_text, zero_count, last_seen').limit(15),
    supabaseAdmin
      .from('mobile_analytics_events')
      .select('id', { count: 'exact', head: true })
      .gte('received_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const categoryHeatmap: Record<string, number> = {};
  for (const row of demandByCategory || []) {
    const cat = (row as { categoria?: string }).categoria || 'sin_categoria';
    categoryHeatmap[cat] = (categoryHeatmap[cat] || 0) + 1;
  }

  const deliveriesByChannel: Record<string, { sent: number; failed: number }> = {};
  for (const d of deliveryStats || []) {
    const ch = (d as { channel: string; status: string }).channel;
    const st = (d as { channel: string; status: string }).status;
    if (!deliveriesByChannel[ch]) deliveriesByChannel[ch] = { sent: 0, failed: 0 };
    if (st === 'sent' || st === 'opened' || st === 'clicked') deliveriesByChannel[ch].sent += 1;
    else if (st === 'failed') deliveriesByChannel[ch].failed += 1;
  }

  return NextResponse.json({
    totals: {
      behavioralEvents: eventsCount || 0,
      behaviorProfiles: profilesCount || 0,
      activeDemandIntents: intentsCount || 0,
      campaigns: campaignsCount || 0,
      packageOrdersPaid: packageOrdersPaid || 0,
      connectedMatches: connectedMatches || 0,
    },
    funnel: {
      demandIntents: intentsCount || 0,
      paidPublications: packageOrdersPaid || 0,
      campaignsLaunched: campaignsCount || 0,
      crossMatchesConnected: connectedMatches || 0,
    },
    demandByCategory: categoryHeatmap,
    deliveriesByChannel,
    recentInferences: recentInferences || [],
    personalizationFunnel: funnelDays || [],
    topZeroSearches: zeroSearches || [],
    mobileAnalyticsEvents24h: mobileEvents24h || 0,
  });
}
