import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeSearch, logSearchEvent } from '@/lib/search/execute-search';
import { upsertDemandIntent } from '@/lib/demand-intents/server';
import { Categoria } from '@/types';

const bodySchema = z.object({
  query: z.string().min(1).max(500),
  category: z.enum([
    'todos', 'empleos', 'inmuebles', 'vehiculos', 'servicios',
    'productos', 'eventos', 'negocios', 'comunidad',
  ]).optional(),
  location: z.string().max(200).optional(),
  maxResults: z.number().int().min(1).max(60).optional(),
  userId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Parámetros inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { query, category, location, maxResults, userId } = parsed.data;
    const started = Date.now();

    const result = await executeSearch({
      query,
      category: category as Categoria | 'todos' | undefined,
      location,
      maxResults: maxResults ?? 40,
      userId,
    });

    void logSearchEvent(query, result.adisos.length, userId);

    if (result.adisos.length === 0) {
      void upsertDemandIntent({
        queryText: query,
        categoria: category && category !== 'todos' ? category : result.normalizedQuery.category,
        source: 'empty_search',
        userId: userId ?? null,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      adisos: result.adisos,
      scores: result.scores,
      count: result.adisos.length,
      alternativeQueries: result.alternativeQueries,
      normalized: {
        cleaned: result.normalizedQuery.cleaned,
        category: result.normalizedQuery.category,
        location: result.normalizedQuery.location,
      },
      source: result.source,
      latencyMs: Date.now() - started,
    });
  } catch (err) {
    console.error('[POST /api/search]', err);
    return NextResponse.json({ error: 'Error al buscar' }, { status: 500 });
  }
}
