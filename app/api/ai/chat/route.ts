import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Adiso, Categoria } from '@/types';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import {
  AIChatRequest,
  AIChatResponse,
  AIIntent,
  PublishDraftPayload,
} from '@/lib/ai/contracts';
import { trackAIEvent } from '@/lib/ai/observability';
import { appendTurn, getOrCreateSession } from '@/lib/ai/session-store';
import {
  estimateChatTurnCost,
  getAIBudgetStatus,
  reserveAIBudget,
} from '@/lib/ai/cost-governance';
import { hasOpenAIKey } from '@/lib/ai/openai-client';
import { hybridSearch } from '@/actions/ai-search';
import { snapAndSell } from '@/actions/ai-vision';
import { analizarBusqueda } from '@/lib/chatbot-nlu';
import { buscarMejorada, generarRespuestaBusqueda } from '@/lib/busqueda-mejorada';
import { getAdisosFromSupabase } from '@/lib/supabase';
import { getInteraccionesUsuario, getUserInterestProfile } from '@/lib/interactions';
import { personalizeAdisos, topInterestCategories } from '@/lib/ai/personalization';

const bodySchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
  userId: z.string().uuid().optional(),
  imageUrl: z.string().optional(),
  context: z
    .object({
      category: z
        .enum([
          'empleos',
          'inmuebles',
          'vehiculos',
          'servicios',
          'productos',
          'eventos',
          'negocios',
          'comunidad',
        ] as const)
        .optional(),
      location: z.string().optional(),
    })
    .optional(),
});

const categorias: Categoria[] = [
  'empleos',
  'inmuebles',
  'vehiculos',
  'servicios',
  'productos',
  'eventos',
  'negocios',
  'comunidad',
];

function detectIntent(msg: string, hasImage: boolean): { intent: AIIntent; confidence: number } {
  const t = msg.toLowerCase();
  if (hasImage || t.includes('foto') || t.includes('imagen')) return { intent: 'vision', confidence: 0.8 };
  if (/(publicar|vender|crear anuncio|subir anuncio)/.test(t)) return { intent: 'publish', confidence: 0.85 };
  if (/(recom|sugerir|algo para mi|para mí)/.test(t)) return { intent: 'recommend', confidence: 0.7 };
  if (/(hola|buenas|ayuda|cómo funciona)/.test(t)) return { intent: 'help', confidence: 0.75 };
  if (t.length > 3) return { intent: 'search', confidence: 0.7 };
  return { intent: 'other', confidence: 0.4 };
}

function buildPublishDraft(message: string): PublishDraftPayload {
  const lower = message.toLowerCase();
  const cat = categorias.find((c) => lower.includes(c.slice(0, -1))) || 'productos';
  return {
    type: 'publish_draft',
    draft: {
      categoria: cat,
      titulo: message.slice(0, 80),
      descripcion: `Borrador generado desde chat: ${message}`,
      confidence: 'medium',
    },
  };
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  const variant = request.headers.get('x-ai-variant') || 'control';
  const ip = getClientIP(request);
  const limited = rateLimit(`ai-chat-${ip}`, { windowMs: 60 * 1000, maxRequests: 40 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Request inválido', details: parsed.error.issues }, { status: 400 });
    }
    const body: AIChatRequest = parsed.data;
    const session = getOrCreateSession(body.sessionId);
    appendTurn(session.sessionId, 'user', body.message);

    trackAIEvent({
      name: 'chat.request.received',
      sessionId: session.sessionId,
      route: '/api/ai/chat',
      status: 'ok',
    });

    const { intent, confidence } = detectIntent(body.message, Boolean(body.imageUrl));
    trackAIEvent({
      name: 'chat.intent.classified',
      sessionId: session.sessionId,
      intent,
      status: 'ok',
      metadata: { confidence },
    });

    const estimated = estimateChatTurnCost(body.message);
    if (!reserveAIBudget(estimated)) {
      const resp: AIChatResponse = {
        sessionId: session.sessionId,
        intent: 'help',
        confidence: 1,
        text: 'La IA está temporalmente en modo de ahorro de presupuesto. Puedes seguir buscando con términos más directos.',
        warnings: ['ai_budget_guard_triggered'],
        meta: { provider: 'heuristic', latencyMs: Date.now() - started },
      };
      appendTurn(session.sessionId, 'assistant', resp.text);
      return NextResponse.json(resp);
    }

    if (intent === 'search') {
      let items = [];
      if (hasOpenAIKey()) {
        const results = await hybridSearch({
          query: body.message,
          category: body.context?.category,
          location: body.context?.location,
          maxResults: 10,
          threshold: 0.1,
        });
        items = results.map((r) => r.adiso);
      } else {
        const analisis = analizarBusqueda(body.message);
        items = await buscarMejorada(analisis, 10);
      }

      if (body.userId) {
        const profile = await getUserInterestProfile(body.userId);
        items = personalizeAdisos(items, profile);
      }

      const text = items.length
        ? generarRespuestaBusqueda(items, analizarBusqueda(body.message))
        : 'No encontré resultados exactos, pero puedo intentar con una búsqueda más amplia si me das más detalle.';

      const resp: AIChatResponse = {
        sessionId: session.sessionId,
        intent,
        confidence,
        text,
        payload: { type: 'search_results', items, total: items.length },
        meta: {
          provider: hasOpenAIKey() ? 'openai' : 'heuristic',
          latencyMs: Date.now() - started,
          costUsd: estimated,
        },
        warnings: variant !== 'control' ? [`ab_variant_${variant}`] : undefined,
      };
      appendTurn(session.sessionId, 'assistant', text);
      trackAIEvent({
        name: 'search.executed',
        sessionId: session.sessionId,
        intent,
        tool: 'search_marketplace_tool',
        latencyMs: Date.now() - started,
        status: 'ok',
        costUsd: estimated,
        metadata: { total: items.length },
      });
      return NextResponse.json(resp);
    }

    if (intent === 'vision' && body.imageUrl) {
      try {
        const analysis = await snapAndSell(body.imageUrl);
        const payload: PublishDraftPayload = {
          type: 'publish_draft',
          draft: {
            categoria: analysis.category as Categoria,
            titulo: analysis.title,
            descripcion: analysis.suggestedDescription,
            precio: analysis.marketPrice,
            imageUrl: body.imageUrl,
            confidence: analysis.marketConfidence === 'alta' ? 'high' : analysis.marketConfidence === 'media' ? 'medium' : 'low',
          },
        };
        const text = 'Analicé tu imagen y armé un borrador de publicación editable.';
        const resp: AIChatResponse = {
          sessionId: session.sessionId,
          intent,
          confidence,
          text,
          payload,
          meta: { provider: 'openai', latencyMs: Date.now() - started, costUsd: estimated },
        };
        appendTurn(session.sessionId, 'assistant', text);
        trackAIEvent({
          name: 'vision.executed',
          sessionId: session.sessionId,
          intent,
          tool: 'vision_tool',
          status: 'ok',
          latencyMs: Date.now() - started,
          costUsd: estimated,
        });
        return NextResponse.json(resp);
      } catch (error: any) {
        trackAIEvent({
          name: 'chat.error',
          level: 'error',
          sessionId: session.sessionId,
          intent,
          tool: 'vision_tool',
          status: 'error',
          latencyMs: Date.now() - started,
          metadata: { message: error?.message },
        });
      }
    }

    if (intent === 'publish') {
      const payload = buildPublishDraft(body.message);
      const text = 'Perfecto. Ya preparé un borrador base. Completemos precio, ubicación y contacto para publicarlo.';
      const resp: AIChatResponse = {
        sessionId: session.sessionId,
        intent,
        confidence,
        text,
        payload,
        meta: { provider: 'heuristic', latencyMs: Date.now() - started, costUsd: estimated },
      };
      appendTurn(session.sessionId, 'assistant', text);
      trackAIEvent({
        name: 'publish.draft.created',
        sessionId: session.sessionId,
        intent,
        tool: 'publish_assistant_tool',
        status: 'ok',
      });
      return NextResponse.json(resp);
    }

    if (intent === 'recommend') {
      const profile = body.userId ? await getUserInterestProfile(body.userId) : null;
      const ocultos = body.userId ? await getInteraccionesUsuario(body.userId, 'not_interested') : new Set<string>();
      const topCategorias = profile ? topInterestCategories(profile) : [];

      let items: Adiso[] = [];
      if (topCategorias.length > 0) {
        const porCategoria = await Promise.all(
          topCategorias.map((categoria) => getAdisosFromSupabase({ categoria, soloActivos: true, limit: 8 }))
        );
        items = personalizeAdisos(porCategoria.flat().filter((a) => !ocultos.has(a.id)), profile).slice(0, 10);
      }

      if (items.length === 0) {
        const recientes = await getAdisosFromSupabase({ soloActivos: true, limit: 10 });
        items = recientes.filter((a) => !ocultos.has(a.id)).slice(0, 10);
      }

      const text = topCategorias.length > 0
        ? `Según tus intereses, estos anuncios de ${topCategorias[0]} podrían gustarte.`
        : 'Aquí tienes algunos anuncios recientes que podrían interesarte.';

      const resp: AIChatResponse = {
        sessionId: session.sessionId,
        intent,
        confidence,
        text,
        payload: { type: 'recommendations', items },
        meta: { provider: 'heuristic', latencyMs: Date.now() - started, costUsd: estimated },
      };
      appendTurn(session.sessionId, 'assistant', text);
      trackAIEvent({
        name: 'chat.tool.executed',
        sessionId: session.sessionId,
        intent,
        tool: 'recommendation_tool',
        status: 'ok',
        latencyMs: Date.now() - started,
        metadata: { total: items.length, personalized: topCategorias.length > 0 },
      });
      return NextResponse.json(resp);
    }

    const budget = getAIBudgetStatus();
    const fallbackText =
      intent === 'help'
        ? 'Puedo ayudarte a buscar, recomendar o preparar una publicación. Dime qué necesitas.'
        : 'No capté bien la intención. ¿Quieres buscar anuncios o publicar uno nuevo?';

    const fallback: AIChatResponse = {
      sessionId: session.sessionId,
      intent,
      confidence,
      text: fallbackText,
      meta: { provider: 'heuristic', latencyMs: Date.now() - started, costUsd: estimated },
      warnings: [`ai_budget_remaining_${budget.remainingUsd}`],
    };
    appendTurn(session.sessionId, 'assistant', fallback.text);
    trackAIEvent({
      name: 'chat.response.sent',
      sessionId: session.sessionId,
      intent,
      status: 'ok',
      latencyMs: Date.now() - started,
      costUsd: estimated,
    });
    return NextResponse.json(fallback);
  } catch (error: any) {
    trackAIEvent({
      name: 'chat.error',
      level: 'error',
      status: 'error',
      route: '/api/ai/chat',
      latencyMs: Date.now() - started,
      metadata: { message: error?.message },
    });
    return NextResponse.json(
      { error: 'Error interno en AI chat', details: error?.message },
      { status: 500 }
    );
  }
}
