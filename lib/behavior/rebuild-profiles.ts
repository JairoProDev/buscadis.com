import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateEmbedding } from '@/lib/ai/embeddings';

const HALF_LIFE_DAYS = 14;
const DECAY_FACTOR = Math.log(2) / HALF_LIFE_DAYS;

function decayValue(value: number, daysSince: number): number {
  return value * Math.exp(-DECAY_FACTOR * daysSince);
}

function bumpJson(
  obj: Record<string, number>,
  key: string,
  delta: number
): Record<string, number> {
  const next = { ...obj };
  next[key] = (next[key] || 0) + delta;
  if (next[key] < 0.01 && next[key] > -0.01) delete next[key];
  return next;
}

interface BehavioralEventRow {
  user_id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  score_delta: number;
  created_at: string;
}

export async function rebuildUserBehaviorProfile(userId: string): Promise<void> {
  const { data: profile } = await supabaseAdmin
    .from('user_behavior_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const since = profile?.events_processed_until || new Date(0).toISOString();

  const { data: events, error } = await supabaseAdmin
    .from('behavioral_events')
    .select('user_id, event_type, entity_type, entity_id, payload, score_delta, created_at')
    .eq('user_id', userId)
    .gt('created_at', since)
    .order('created_at', { ascending: true })
    .limit(5000);

  if (error) {
    console.error('[rebuild-profile] events error:', error.message);
    return;
  }

  if (!events?.length && profile) return;

  let categoryAffinity: Record<string, number> =
    (profile?.category_affinity as Record<string, number>) || {};
  let keywordAffinity: Record<string, number> =
    (profile?.keyword_affinity as Record<string, number>) || {};
  let facetPreferences: Record<string, unknown> =
    (profile?.facet_preferences as Record<string, unknown>) || {};
  let negativeSignals: Record<string, number> =
    (profile?.negative_signals as Record<string, number>) || {};
  const engagementStats: Record<string, number> =
    (profile?.engagement_stats as Record<string, number>) || {
      searches: 0,
      clicks: 0,
      contacts: 0,
      views: 0,
    };

  const now = Date.now();
  const daysSinceUpdate = profile?.updated_at
    ? (now - new Date(profile.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  if (daysSinceUpdate > 0) {
    for (const [k, v] of Object.entries(categoryAffinity)) {
      categoryAffinity[k] = decayValue(v, daysSinceUpdate);
    }
    for (const [k, v] of Object.entries(keywordAffinity)) {
      keywordAffinity[k] = decayValue(v, daysSinceUpdate);
    }
  }

  const embeddingTexts: string[] = [];
  let lastEventAt = since;

  for (const ev of (events || []) as BehavioralEventRow[]) {
    lastEventAt = ev.created_at;
    const payload = ev.payload || {};
    const categoria = typeof payload.categoria === 'string' ? payload.categoria : null;
    const termino = typeof payload.termino === 'string' ? payload.termino : null;
    const delta = ev.score_delta || 0;

    switch (ev.event_type) {
      case 'search.performed':
        engagementStats.searches = (engagementStats.searches || 0) + 1;
        if (termino) {
          embeddingTexts.push(termino);
          const words = termino.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
          for (const w of words.slice(0, 5)) {
            keywordAffinity = bumpJson(keywordAffinity, w, 1);
          }
        }
        break;
      case 'ad.click':
        engagementStats.clicks = (engagementStats.clicks || 0) + 1;
        if (categoria) categoryAffinity = bumpJson(categoryAffinity, categoria, 0.5);
        break;
      case 'ad.view_end':
        engagementStats.views = (engagementStats.views || 0) + 1;
        break;
      case 'ad.favorite':
        if (categoria) categoryAffinity = bumpJson(categoryAffinity, categoria, 2);
        break;
      case 'ad.dismiss':
      case 'ad.dismiss_reason':
        if (categoria) {
          categoryAffinity = bumpJson(categoryAffinity, categoria, -1);
          negativeSignals = bumpJson(negativeSignals, categoria, 1);
        }
        break;
      case 'ad.contact_whatsapp':
      case 'ad.contact_chat':
        engagementStats.contacts = (engagementStats.contacts || 0) + 1;
        if (categoria) categoryAffinity = bumpJson(categoryAffinity, categoria, 3);
        break;
      case 'filter.applied':
        if (payload.filters && typeof payload.filters === 'object') {
          facetPreferences = { ...facetPreferences, ...(payload.filters as Record<string, unknown>) };
        }
        break;
      case 'category.selected':
        if (typeof payload.categoria === 'string') {
          categoryAffinity = bumpJson(categoryAffinity, payload.categoria, 1);
        }
        break;
      default:
        if (categoria && delta !== 0) {
          categoryAffinity = bumpJson(categoryAffinity, categoria, delta);
        }
    }
  }

  // Infer disinterest: views without contact
  const { data: recentViews } = await supabaseAdmin
    .from('behavioral_events')
    .select('entity_id, created_at')
    .eq('user_id', userId)
    .eq('event_type', 'ad.view_end')
    .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  if (recentViews?.length) {
    for (const view of recentViews) {
      if (!view.entity_id) continue;
      const { data: contact } = await supabaseAdmin
        .from('behavioral_events')
        .select('id')
        .eq('user_id', userId)
        .in('event_type', ['ad.contact_whatsapp', 'ad.contact_chat'])
        .eq('entity_id', view.entity_id)
        .gte('created_at', view.created_at)
        .limit(1);
      if (!contact?.length) {
        const { data: adiso } = await supabaseAdmin
          .from('adisos')
          .select('categoria')
          .eq('id', view.entity_id)
          .maybeSingle();

        const cat = adiso?.categoria as string | undefined;
        if (cat) {
          categoryAffinity = bumpJson(categoryAffinity, cat, -0.3);
          negativeSignals = bumpJson(negativeSignals, `view_no_contact:${view.entity_id}`, 1);
        }

        await supabaseAdmin.from('inference_log').insert({
          user_id: userId,
          inference_type: 'disinterest_soft',
          input_summary: { adiso_id: view.entity_id, categoria: cat },
          output_summary: { action: 'category_decay', delta: -0.3 },
          confidence: 0.5,
        });
      }
    }
  }

  let intentEmbedding: number[] | null = null;
  if (embeddingTexts.length > 0) {
    try {
      const combined = embeddingTexts.slice(-10).join(' | ');
      intentEmbedding = await generateEmbedding(combined);
    } catch {
      // keep previous
    }
  }

  const clicks = engagementStats.clicks || 0;
  const contacts = engagementStats.contacts || 0;
  engagementStats.contact_rate = clicks > 0 ? contacts / clicks : 0;

  const row = {
    user_id: userId,
    category_affinity: categoryAffinity,
    keyword_affinity: keywordAffinity,
    facet_preferences: facetPreferences,
    negative_signals: negativeSignals,
    engagement_stats: engagementStats,
    intent_embedding: intentEmbedding || profile?.intent_embedding || null,
    last_active_at: lastEventAt !== since ? lastEventAt : profile?.last_active_at,
    events_processed_until: lastEventAt,
    profile_version: (profile?.profile_version || 0) + 1,
    updated_at: new Date().toISOString(),
  };

  await supabaseAdmin.from('user_behavior_profiles').upsert(row);

  // Sync legacy user_interest_profile for compatibility
  const categoriaSignals: Record<string, number> = {};
  for (const [k, v] of Object.entries(categoryAffinity)) {
    categoriaSignals[k] = Math.round(v);
  }
  await supabaseAdmin.from('user_interest_profile').upsert({
    user_id: userId,
    categoria_signals: categoriaSignals,
    keyword_signals: Object.fromEntries(
      Object.entries(keywordAffinity).map(([k, v]) => [k, Math.round(v)])
    ),
    dismiss_reasons: negativeSignals,
    updated_at: new Date().toISOString(),
  });
}

import { syncRecentEventsToGraph } from '@/lib/graph/sync';

export async function rebuildAllProfiles(batchSize = 50): Promise<number> {
  const { data: users } = await supabaseAdmin
    .from('behavioral_events')
    .select('user_id')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500);

  const uniqueIds = [...new Set((users || []).map((u) => u.user_id as string))].slice(0, batchSize);
  let processed = 0;
  for (const userId of uniqueIds) {
    await rebuildUserBehaviorProfile(userId);
    processed += 1;
  }
  await syncRecentEventsToGraph(100);
  return processed;
}
