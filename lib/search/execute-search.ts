import { supabaseAdmin } from '@/lib/supabase-admin';
import { hybridSearch } from '@/actions/ai-search';
import { normalizeQuery } from './normalize-query';
import { rerankSearchResults, type ScoredAdiso } from './rerank';
import { Adiso, Categoria } from '@/types';
import type { UserInterestProfile } from '@/lib/interactions';

export interface ExecuteSearchParams {
  query: string;
  category?: Categoria | 'todos';
  location?: string;
  maxResults?: number;
  userId?: string;
  interestProfile?: UserInterestProfile | null;
}

export interface ExecuteSearchResult {
  adisos: Adiso[];
  scores: Record<string, number>;
  normalizedQuery: ReturnType<typeof normalizeQuery>;
  alternativeQueries: string[];
  source: 'hybrid' | 'trgm' | 'hybrid+trgm';
}

function mapRowToAdiso(row: Record<string, unknown>): Adiso {
  const imagenes =
    typeof row.imagenes_urls === 'string'
      ? JSON.parse(row.imagenes_urls as string)
      : row.imagenes_urls;

  return {
    id: row.id as string,
    categoria: row.categoria as Categoria,
    titulo: (row.titulo as string) ?? '',
    descripcion: (row.descripcion as string) ?? '',
    contacto: (row.contacto as string) ?? '',
    ubicacion: row.ubicacion as Adiso['ubicacion'],
    fechaPublicacion: (row.fecha_publicacion as string) ?? '',
    horaPublicacion: (row.hora_publicacion as string) ?? '',
    imagenesUrls: Array.isArray(imagenes) ? imagenes : undefined,
    imagenUrl: Array.isArray(imagenes) ? imagenes[0] : undefined,
  };
}

async function trgmFallback(query: string, limit: number): Promise<ScoredAdiso[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.rpc('search_adisos_trgm', {
    search_text: query,
    result_limit: limit,
  });
  if (error || !data) {
    console.warn('[search] trgm fallback error:', error?.message);
    return [];
  }
  return (data as Record<string, unknown>[]).map((row) => ({
    adiso: mapRowToAdiso(row),
    score: (row.trgm_score as number) ?? 0,
    hybrid_score: (row.trgm_score as number) ?? 0,
  }));
}

async function incrementQueryPopularity(query: string): Promise<void> {
  if (!supabaseAdmin || !query.trim()) return;
  const q = query.trim().toLowerCase();
  try {
    const { data: existing } = await supabaseAdmin
      .from('search_query_popularity')
      .select('count')
      .eq('query', q)
      .maybeSingle();

    if (existing && typeof existing.count === 'number') {
      await supabaseAdmin
        .from('search_query_popularity')
        .update({ count: existing.count + 1, last_used: new Date().toISOString() })
        .eq('query', q);
    } else {
      await supabaseAdmin.from('search_query_popularity').insert({
        query: q,
        count: 1,
        last_used: new Date().toISOString(),
      });
    }
  } catch {
    // non-blocking
  }
}

function buildAlternativeQueries(normalized: ReturnType<typeof normalizeQuery>): string[] {
  const alts: string[] = [];
  if (normalized.category) {
    alts.push(`${normalized.analysis.terminos[0] ?? ''} ${normalized.category}`.trim());
  }
  if (normalized.location) {
    alts.push(`${normalized.analysis.terminos.join(' ')} ${normalized.location}`.trim());
  }
  for (const term of normalized.expandedTerms.slice(0, 3)) {
    if (term.length > 3 && term !== normalized.raw.toLowerCase()) {
      alts.push(term);
    }
  }
  return [...new Set(alts.filter((a) => a.length > 2))].slice(0, 4);
}

export async function executeSearch(params: ExecuteSearchParams): Promise<ExecuteSearchResult> {
  const { query, maxResults = 40, userId, interestProfile } = params;
  const normalized = normalizeQuery(query);

  if (!normalized.raw) {
    return { adisos: [], scores: {}, normalizedQuery: normalized, alternativeQueries: [], source: 'hybrid' };
  }

  const filterCategory =
    params.category && params.category !== 'todos'
      ? params.category
      : normalized.category;

  const filterLocation = params.location ?? normalized.location;

  let scored: ScoredAdiso[] = [];
  let source: ExecuteSearchResult['source'] = 'hybrid';

  try {
    const hybridResults = await hybridSearch({
      query: normalized.cleaned || normalized.raw,
      category: filterCategory,
      location: filterLocation,
      maxResults,
      threshold: 0.08,
      onlyActive: true,
    });

    scored = hybridResults.map((r) => ({
      adiso: r.adiso,
      score: r.rerank_score ?? r.hybrid_score,
      hybrid_score: r.hybrid_score,
      rerank_score: r.rerank_score,
    }));
  } catch (err) {
    console.warn('[search] hybrid failed, using trgm:', err);
    scored = await trgmFallback(normalized.raw, maxResults);
    source = 'trgm';
  }

  if (scored.length < Math.min(5, maxResults)) {
    const trgm = await trgmFallback(normalized.cleaned || normalized.raw, maxResults);
    const seen = new Set(scored.map((s) => s.adiso.id));
    for (const item of trgm) {
      if (!seen.has(item.adiso.id)) {
        scored.push(item);
        seen.add(item.adiso.id);
      }
    }
    if (source === 'hybrid' && trgm.length > 0) source = 'hybrid+trgm';
  }

  const reranked = rerankSearchResults(scored, {
    interestProfile,
    inferredCategory: filterCategory,
  });

  const adisos = reranked.map((r) => r.adiso);
  const scores: Record<string, number> = {};
  for (const r of reranked) {
    scores[r.adiso.id] = r.rerank_score ?? r.score;
  }

  void incrementQueryPopularity(normalized.raw);

  return {
    adisos,
    scores,
    normalizedQuery: normalized,
    alternativeQueries: adisos.length === 0 ? buildAlternativeQueries(normalized) : [],
    source,
  };
}

export async function logSearchEvent(
  query: string,
  resultsCount: number,
  userId?: string,
): Promise<void> {
  const { logSearch } = await import('@/actions/ai-search');
  void logSearch(query, resultsCount, userId).catch(() => undefined);

  if (supabaseAdmin) {
    void supabaseAdmin.from('ai_search_logs').insert({
      query_text: query,
      results_count: resultsCount,
      user_id: userId ?? null,
      session_id: Math.random().toString(36).slice(2, 10),
    }).then(({ error }) => {
      if (error) console.warn('[search] log insert:', error.message);
    });
  }
}
