import { supabaseAdmin } from '@/lib/supabase-admin';
import type { UserInterestProfile } from '@/lib/interactions';

export type UserFeatures = UserInterestProfile & {
  facetPreferences: Record<string, unknown>;
  engagementStats: Record<string, unknown>;
  intentEmbedding: number[] | null;
  source: 'behavior' | 'legacy' | 'empty';
};

/**
 * Canonical feature read for ranking / search / AI (server-side).
 * Prefers user_behavior_profiles; falls back to legacy user_interest_profile.
 */
export async function getUserFeatures(userId: string): Promise<UserFeatures | null> {
  if (!userId) return null;

  const { data: behavior, error: bErr } = await supabaseAdmin
    .from('user_behavior_profiles')
    .select(
      'category_affinity, keyword_affinity, negative_signals, facet_preferences, engagement_stats, intent_embedding'
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (!bErr && behavior) {
    const cat = (behavior.category_affinity as Record<string, number>) || {};
    const kw = (behavior.keyword_affinity as Record<string, number>) || {};
    const neg = (behavior.negative_signals as Record<string, number>) || {};
    const hasSignal =
      Object.keys(cat).length > 0 || Object.keys(kw).length > 0 || Object.keys(neg).length > 0;

    if (hasSignal || behavior.intent_embedding) {
      return {
        categoriaSignals: cat,
        keywordSignals: kw,
        dismissReasons: neg,
        facetPreferences: (behavior.facet_preferences as Record<string, unknown>) || {},
        engagementStats: (behavior.engagement_stats as Record<string, unknown>) || {},
        intentEmbedding: Array.isArray(behavior.intent_embedding)
          ? (behavior.intent_embedding as number[])
          : null,
        source: 'behavior',
      };
    }
  }

  const { data: legacy } = await supabaseAdmin
    .from('user_interest_profile')
    .select('categoria_signals, keyword_signals, dismiss_reasons')
    .eq('user_id', userId)
    .maybeSingle();

  if (!legacy) {
    return {
      categoriaSignals: {},
      keywordSignals: {},
      dismissReasons: {},
      facetPreferences: {},
      engagementStats: {},
      intentEmbedding: null,
      source: 'empty',
    };
  }

  return {
    categoriaSignals: (legacy.categoria_signals as Record<string, number>) || {},
    keywordSignals: (legacy.keyword_signals as Record<string, number>) || {},
    dismissReasons: (legacy.dismiss_reasons as Record<string, number>) || {},
    facetPreferences: {},
    engagementStats: {},
    intentEmbedding: null,
    source: 'legacy',
  };
}

export function toInterestProfile(features: UserFeatures | null): UserInterestProfile | null {
  if (!features) return null;
  return {
    categoriaSignals: features.categoriaSignals,
    keywordSignals: features.keywordSignals,
    dismissReasons: features.dismissReasons,
  };
}
