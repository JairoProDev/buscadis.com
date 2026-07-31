/**
 * AI-Powered Hybrid Search Server Action
 *
 * This module provides RAG-based search functionality combining:
 * - Semantic search (vector embeddings)
 * - Keyword search (Full-Text Search)
 * - Category and location filtering
 */

'use server';

import { supabase } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { Adiso, Categoria } from '@/types';
import { trackAIEvent } from '@/lib/ai/observability';

export interface HybridSearchParams {
  query: string;
  category?: Categoria;
  location?: string;
  maxResults?: number;
  threshold?: number;
  onlyActive?: boolean;
}

export interface HybridSearchResult {
  adiso: Adiso;
  similarity_score: number;
  keyword_rank: number;
  hybrid_score: number;
  rerank_score?: number;
}

function calculateFreshnessBoost(fechaPublicacion: string): number {
  const published = new Date(fechaPublicacion).getTime();
  if (Number.isNaN(published)) return 0;
  const days = Math.max(0, (Date.now() - published) / (1000 * 60 * 60 * 24));
  if (days <= 1) return 0.2;
  if (days <= 7) return 0.12;
  if (days <= 30) return 0.05;
  return 0;
}

/**
 * Perform hybrid search (Semantic + Keyword)
 *
 * @param params - Search parameters
 * @returns Array of search results with scores
 */
export async function hybridSearch(
  params: HybridSearchParams
): Promise<HybridSearchResult[]> {
  const {
    query,
    category,
    location,
    maxResults = 10,
    threshold = 0.28,
    onlyActive = true,
  } = params;

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }

  try {
    const started = Date.now();
    console.log(`🔍 Hybrid Search: "${query}" | Category: ${category || 'all'} | Location: ${location || 'all'}`);

    // Step 1: Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Call the Supabase hybrid search RPC function
    let { data, error } = await supabase.rpc('match_adisos_hybrid', {
      query_embedding: queryEmbedding,
      query_text: query,
      match_threshold: threshold,
      match_count: maxResults,
      filter_category: category || null,
      filter_location: location || null,
      only_active: onlyActive,
    });

    if (error) {
      console.error('Hybrid search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    // Relaxed fallback: still require meaningful similarity (never near-zero noise)
    if (!data || data.length === 0) {
      console.log('⚠️ No exact matches. Attempting relaxed search...');

      const relaxedResult = await supabase.rpc('match_adisos_hybrid', {
        query_embedding: queryEmbedding,
        query_text: query,
        match_threshold: Math.min(threshold, 0.18),
        match_count: maxResults,
        filter_category: category || null,
        filter_location: location || null,
        only_active: onlyActive,
      });

      if (!relaxedResult.error && relaxedResult.data) {
        data = relaxedResult.data;
        console.log(`✅ Relaxed search found ${data.length} results`);
      }
    }

    if (!data || data.length === 0) {
      console.log('📭 No hybrid matches — trying title keyword fallback');
      const { data: fallbackRows } = await supabase
        .from('adisos')
        .select('*')
        .ilike('titulo', `%${query}%`)
        .eq('esta_activo', true)
        .limit(maxResults);
      if (!fallbackRows || fallbackRows.length === 0) return [];
      data = fallbackRows.map((row: any) => ({
        ...row,
        similarity_score: 0,
        keyword_rank: 0.2,
        hybrid_score: 0.2,
      }));
    }

    console.log(`✅ Found ${data.length} raw results`);

    // Step 3: Deduplicate, gate weak semantic-only hits, transform
    const uniqueIds = new Set();
    const uniqueTitles = new Set();
    const results: HybridSearchResult[] = [];
    const queryNorm = query.toLowerCase().trim();

    for (const row of data) {
      if (uniqueIds.has(row.id)) continue;

      const normalizedTitle = row.titulo?.toLowerCase().trim();
      if (!normalizedTitle) continue;
      if (uniqueTitles.has(normalizedTitle)) continue;

      const similarity = Number(row.similarity_score) || 0;
      const keywordRank = Number(row.keyword_rank) || 0;
      const hybrid = Number(row.hybrid_score) || 0;
      const titleHasQuery =
        Boolean(normalizedTitle) &&
        queryNorm.length >= 3 &&
        normalizedTitle.includes(queryNorm);
      const descHasQuery =
        typeof row.descripcion === 'string' &&
        queryNorm.length >= 3 &&
        row.descripcion.toLowerCase().includes(queryNorm);

      // Drop pure semantic noise: no lexical signal and weak similarity
      if (keywordRank <= 0 && !titleHasQuery && !descHasQuery && similarity < 0.35) {
        continue;
      }
      if (hybrid < Math.min(threshold, 0.15) && !titleHasQuery && !descHasQuery) {
        continue;
      }

      uniqueIds.add(row.id);
      uniqueTitles.add(normalizedTitle);

      const freshness = calculateFreshnessBoost(row.fecha_publicacion || row.created_at);
      const baseScore = hybrid;
      const lexicalBoost = titleHasQuery ? 0.25 : descHasQuery ? 0.12 : 0;
      const rerankScore = baseScore + freshness + lexicalBoost;
      results.push({
        adiso: {
          id: row.id,
          categoria: row.categoria as Categoria,
          titulo: row.titulo || '',
          descripcion: row.descripcion || '',
          contacto: row.contacto,
          ubicacion: row.ubicacion,
          fechaPublicacion: row.fecha_publicacion,
          horaPublicacion: row.hora_publicacion,
          imagenesUrls: typeof row.imagenes_urls === 'string' ? JSON.parse(row.imagenes_urls) : row.imagenes_urls,
        },
        similarity_score: similarity,
        keyword_rank: keywordRank,
        hybrid_score: hybrid,
        rerank_score: rerankScore,
      });
    }

    results.sort((a, b) => (b.rerank_score || b.hybrid_score) - (a.rerank_score || a.hybrid_score));
    trackAIEvent({
      name: 'search.executed',
      status: 'ok',
      tool: 'hybridSearch',
      latencyMs: Date.now() - started,
      metadata: { query, count: results.length, category, location },
    });
    return results;
  } catch (error: any) {
    console.error('❌ Hybrid search failed:', error);
    trackAIEvent({
      name: 'chat.error',
      level: 'error',
      status: 'error',
      tool: 'hybridSearch',
      metadata: { query, message: error?.message },
    });
    throw error;
  }
}

/**
 * Semantic-only search (vector similarity)
 * Use when you want conceptual matches without keyword constraints
 *
 * @param query - Search query
 * @param maxResults - Max number of results
 * @param threshold - Similarity threshold (0-1)
 * @returns Array of adisos with similarity scores
 */
export async function semanticSearch(
  query: string,
  maxResults: number = 10,
  threshold: number = 0.5
): Promise<Array<Adiso & { similarity: number }>> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Call semantic search RPC
    const { data, error } = await supabase.rpc('match_adisos_semantic', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: maxResults,
    });

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      categoria: row.categoria as Categoria,
      titulo: row.titulo,
      descripcion: row.descripcion,
      contacto: '',
      ubicacion: '',
      fechaPublicacion: '',
      horaPublicacion: '',
      similarity: row.similarity,
    }));
  } catch (error: any) {
    console.error('Semantic search failed:', error);
    throw error;
  }
}

/**
 * Log search query for analytics
 *
 * @param query - Search query
 * @param resultsCount - Number of results found
 * @param userId - Optional user ID
 */
export async function logSearch(
  query: string,
  resultsCount: number,
  userId?: string
): Promise<void> {
  if (!supabase) return;

  try {
    const queryEmbedding = await generateEmbedding(query);

    await supabase.from('ai_search_logs').insert({
      query_text: query,
      query_embedding: queryEmbedding,
      results_count: resultsCount,
      user_id: userId || null,
      session_id: Math.random().toString(36).substring(7),
    });
  } catch (error) {
    // Don't fail the search if logging fails
    console.error('Failed to log search:', error);
  }
}

/**
 * Get personalized recommendations for a user
 * Based on their search history
 *
 * @param userId - User ID
 * @param limit - Number of recommendations
 * @returns Array of recommended adisos
 */
export async function getRecommendations(
  userId: string,
  limit: number = 10
): Promise<Adiso[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.rpc('get_user_recommendations', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      titulo: row.titulo,
      categoria: row.categoria as Categoria,
      descripcion: '',
      contacto: '',
      ubicacion: '',
      fechaPublicacion: '',
      horaPublicacion: '',
    }));
  } catch (error: any) {
    console.error('Failed to get recommendations:', error);
    return [];
  }
}
