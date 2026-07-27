import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isPlatformAdminUser } from '@/lib/platform-admin';
import {
  computePersonalizationFunnel,
  shouldEnableLearnedRanker,
} from '@/lib/behavior/funnel-metrics';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) return null;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('rol, is_platform_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!isPlatformAdminUser(user.email, profile)) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const funnel = await computePersonalizationFunnel(7);
  const ltrGate = shouldEnableLearnedRanker(funnel);

  const totals = funnel.reduce(
    (acc, d) => {
      acc.impressions += d.impressions;
      acc.clicks += d.clicks;
      acc.contacts += d.contacts;
      acc.favorites += d.favorites;
      acc.searches += d.searches;
      return acc;
    },
    { impressions: 0, clicks: 0, contacts: 0, favorites: 0, searches: 0 }
  );

  return NextResponse.json({
    ok: true,
    windowDays: 7,
    totals: {
      ...totals,
      ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
      contact_rate: totals.clicks > 0 ? totals.contacts / totals.clicks : 0,
      save_rate: totals.clicks > 0 ? totals.favorites / totals.clicks : 0,
    },
    daily: funnel,
    learnedRanker: ltrGate,
    notes: [
      'Heuristic ranking + exploration until contact volume hits LTR threshold.',
      'No paid feature-store / CDP — Postgres + cron only.',
    ],
  });
}
