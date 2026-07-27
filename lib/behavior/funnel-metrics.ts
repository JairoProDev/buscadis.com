import { supabaseAdmin } from '@/lib/supabase-admin';

export type FunnelDay = {
  day: string;
  impressions: number;
  clicks: number;
  favorites: number;
  contacts: number;
  dismisses: number;
  searches: number;
  unique_actors: number;
  ctr: number;
  contact_rate: number;
  save_rate: number;
};

/**
 * Offline personalization funnel from behavioral_events (last N days).
 * Prefer the SQL view when available; fall back to aggregation in JS.
 */
export async function computePersonalizationFunnel(days = 7): Promise<FunnelDay[]> {
  const { data: viewRows, error: viewErr } = await supabaseAdmin
    .from('v_personalization_funnel_7d')
    .select('*')
    .limit(days);

  if (!viewErr && viewRows?.length) {
    return viewRows.map((row: Record<string, unknown>) => {
      const impressions = Number(row.impressions || 0);
      const clicks = Number(row.clicks || 0);
      const contacts = Number(row.contacts || 0);
      const favorites = Number(row.favorites || 0);
      return {
        day: String(row.day),
        impressions,
        clicks,
        favorites,
        contacts,
        dismisses: Number(row.dismisses || 0),
        searches: Number(row.searches || 0),
        unique_actors: Number(row.unique_actors || 0),
        ctr: impressions > 0 ? clicks / impressions : 0,
        contact_rate: clicks > 0 ? contacts / clicks : 0,
        save_rate: clicks > 0 ? favorites / clicks : 0,
      };
    });
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: events, error } = await supabaseAdmin
    .from('behavioral_events')
    .select('event_type, user_id, anonymous_id, created_at')
    .gte('created_at', since)
    .limit(50_000);

  if (error || !events) return [];

  const byDay = new Map<
    string,
    {
      impressions: number;
      clicks: number;
      favorites: number;
      contacts: number;
      dismisses: number;
      searches: number;
      actors: Set<string>;
    }
  >();

  for (const ev of events) {
    const day = String(ev.created_at).slice(0, 10);
    let bucket = byDay.get(day);
    if (!bucket) {
      bucket = {
        impressions: 0,
        clicks: 0,
        favorites: 0,
        contacts: 0,
        dismisses: 0,
        searches: 0,
        actors: new Set(),
      };
      byDay.set(day, bucket);
    }
    const actor = (ev.user_id as string) || (ev.anonymous_id as string) || 'anon';
    bucket.actors.add(actor);
    switch (ev.event_type) {
      case 'ad.impression':
        bucket.impressions += 1;
        break;
      case 'ad.click':
        bucket.clicks += 1;
        break;
      case 'ad.favorite':
        bucket.favorites += 1;
        break;
      case 'ad.contact_whatsapp':
      case 'ad.contact_chat':
      case 'ad.contact_copy':
        bucket.contacts += 1;
        break;
      case 'ad.dismiss':
      case 'ad.dismiss_reason':
        bucket.dismisses += 1;
        break;
      case 'search.performed':
        bucket.searches += 1;
        break;
    }
  }

  return [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, b]) => ({
      day,
      impressions: b.impressions,
      clicks: b.clicks,
      favorites: b.favorites,
      contacts: b.contacts,
      dismisses: b.dismisses,
      searches: b.searches,
      unique_actors: b.actors.size,
      ctr: b.impressions > 0 ? b.clicks / b.impressions : 0,
      contact_rate: b.clicks > 0 ? b.contacts / b.clicks : 0,
      save_rate: b.clicks > 0 ? b.favorites / b.clicks : 0,
    }));
}

/** Volume gate for future LTR — do not train until threshold. */
export function shouldEnableLearnedRanker(funnel: FunnelDay[]): {
  ready: boolean;
  contacts7d: number;
  threshold: number;
} {
  const threshold = 10_000;
  const contacts7d = funnel.reduce((s, d) => s + d.contacts, 0);
  return { ready: contacts7d >= threshold, contacts7d, threshold };
}
