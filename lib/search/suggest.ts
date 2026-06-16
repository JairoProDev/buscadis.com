import { supabaseAdmin } from '@/lib/supabase-admin';
import { typesenseSuggest, upsertAdisoTitle, type SuggestHit } from './typesense-client';
import { Adiso } from '@/types';

export interface SuggestResponse {
  adisos: Array<{ id: string; titulo: string; categoria: string }>;
  queries: string[];
  completion: string | null;
  hits: SuggestHit[];
}

async function postgresSuggest(prefix: string, limit: number): Promise<SuggestResponse> {
  if (!supabaseAdmin) {
    return { adisos: [], queries: [], completion: null, hits: [] };
  }

  const { data: titles } = await supabaseAdmin.rpc('suggest_adiso_titles_trgm', {
    prefix: prefix.trim(),
    result_limit: limit,
  });

  const { data: popular } = await supabaseAdmin
    .from('search_query_popularity')
    .select('query')
    .ilike('query', `${prefix.trim().toLowerCase()}%`)
    .order('count', { ascending: false })
    .limit(3);

  const adisos = ((titles ?? []) as Array<{ id: string; titulo: string; categoria: string }>).map(
    (r) => ({ id: r.id, titulo: r.titulo, categoria: r.categoria }),
  );

  const queries = (popular ?? []).map((r: { query: string }) => r.query);

  const topTitle = adisos[0]?.titulo ?? queries[0] ?? null;
  let completion: string | null = null;
  if (topTitle && topTitle.toLowerCase().startsWith(prefix.toLowerCase()) && topTitle.length > prefix.length) {
    completion = topTitle.slice(prefix.length);
  }

  const hits: SuggestHit[] = [
    ...adisos.map((a) => ({ type: 'adiso' as const, ...a })),
    ...queries.map((q) => ({ type: 'query' as const, query: q })),
  ];

  return { adisos, queries, completion, hits };
}

export async function getSearchSuggestions(prefix: string, limit = 8): Promise<SuggestResponse> {
  const trimmed = prefix.trim();
  if (trimmed.length < 2) {
    return { adisos: [], queries: [], completion: null, hits: [] };
  }

  const tsHits = await typesenseSuggest(trimmed, limit);
  if (tsHits.length > 0) {
    const adisos = tsHits
      .filter((h) => h.type === 'adiso' && h.id && h.titulo)
      .map((h) => ({ id: h.id!, titulo: h.titulo!, categoria: h.categoria ?? '' }));

    const queries = tsHits
      .filter((h) => h.type === 'query' && h.query)
      .map((h) => h.query!);

    const topTitle = adisos[0]?.titulo ?? queries[0] ?? null;
    let completion: string | null = null;
    if (topTitle && topTitle.toLowerCase().startsWith(trimmed.toLowerCase()) && topTitle.length > trimmed.length) {
      completion = topTitle.slice(trimmed.length);
    }

    return { adisos, queries, completion, hits: tsHits };
  }

  return postgresSuggest(trimmed, limit);
}

export async function syncAdisoToTypesense(adiso: Pick<Adiso, 'id' | 'titulo' | 'categoria'>): Promise<void> {
  if (!adiso.titulo?.trim()) return;
  await upsertAdisoTitle({
    id: adiso.id,
    titulo: adiso.titulo,
    categoria: adiso.categoria,
    popularity_score: 0,
  });
}
