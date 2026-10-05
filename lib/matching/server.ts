import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { anonymizeInterestedUser, InterestedUserPreview } from './score';

export interface DraftForMatching {
  categoria: string;
  titulo: string;
  descripcion: string;
  ubicacion?: Record<string, unknown>;
  facets?: Record<string, unknown>;
}

export async function matchInterestedUsers(
  draft: DraftForMatching,
  limit = 50
): Promise<InterestedUserPreview[]> {
  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(`${draft.titulo} ${draft.descripcion}`.trim());
  } catch {
    // RPC can still match by category/demand
  }

  const { data, error } = await supabaseAdmin.rpc('fn_match_interested_users', {
    p_categoria: draft.categoria,
    p_titulo: draft.titulo,
    p_descripcion: draft.descripcion,
    p_ubicacion: draft.ubicacion || {},
    p_facets: draft.facets || {},
    p_draft_embedding: embedding,
    p_limit: limit,
  });

  if (error) {
    console.error('[matching] RPC error:', error.message);
    return [];
  }

  return (data || []).map(
  (
    row: {
      user_id: string;
      match_score: number;
      match_reasons: string[] | null;
      last_active_at?: string;
    },
    i: number
  ) => anonymizeInterestedUser(row, i)
  );
}

export async function matchAdsForUser(
  userId: string,
  limit = 12,
  categoria?: string | null,
): Promise<{ adisoId: string; score: number }[]> {
  const scopedCategory = categoria && categoria !== 'todos' ? categoria : null;
  const fetchLimit = scopedCategory ? Math.min(limit * 5, 60) : limit;

  const { data, error } = await supabaseAdmin.rpc('fn_match_ads_for_user', {
    p_user_id: userId,
    p_limit: fetchLimit,
  });

  if (error) {
    console.error('[matching] ads for user error:', error.message);
    return [];
  }

  let results = (data || []).map((r: { adiso_id: string; match_score: number }) => ({
    adisoId: r.adiso_id,
    score: r.match_score,
  }));

  if (scopedCategory && results.length > 0) {
    const ids = results.map((r) => r.adisoId);
    const { data: rows, error: catError } = await supabaseAdmin
      .from('adisos')
      .select('id')
      .in('id', ids)
      .eq('categoria', scopedCategory);

    if (catError) {
      console.error('[matching] category filter error:', catError.message);
      return [];
    }

    const allowed = new Set((rows || []).map((r: { id: string }) => r.id));
    results = results.filter((r) => allowed.has(r.adisoId)).slice(0, limit);
  }

  return results;
}

export async function createSupplyDemandMatches(
  supplyAdisoId: string,
  draft: DraftForMatching
): Promise<number> {
  const interested = await matchInterestedUsers(draft, 100);
  let created = 0;

  for (const user of interested) {
    const { data: intents } = await supabaseAdmin
      .from('demand_intents')
      .select('id')
      .eq('user_id', user.userId)
      .eq('status', 'active')
      .limit(1);

    const intentId = intents?.[0]?.id;
    if (!intentId) continue;

    const { error } = await supabaseAdmin.from('supply_demand_matches').insert({
      demand_intent_id: intentId,
      supply_adiso_id: supplyAdisoId,
      match_score: user.matchScore,
      status: 'pending',
      updated_at: new Date().toISOString(),
    });

    if (!error) created += 1;
  }

  return created;
}
