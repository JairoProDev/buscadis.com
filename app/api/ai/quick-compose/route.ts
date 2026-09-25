import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from 'ai';
import { Categoria } from '@/types';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { hasOpenAIKey, openai, AI_MODELS } from '@/lib/ai/openai-client';
import { analizarBusqueda } from '@/lib/chatbot-nlu';

const bodySchema = z.object({
  text: z.string().min(1).max(500),
});

const CATEGORIAS = [
  'empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad',
] as const;

const DraftSchema = z.object({
  titulo: z.string().describe('Título atractivo para el adiso (máx 80 caracteres)'),
  descripcion: z.string().describe('Descripción del adiso (100-300 caracteres)'),
  categoria: z.enum(CATEGORIAS).describe('Categoría más apropiada para este adiso'),
  precio: z.number().optional().describe('Precio en soles si se menciona o se puede inferir'),
  condicion: z.string().optional().describe('Condición del producto/servicio si aplica'),
  tags: z.array(z.string()).optional().describe('Hasta 5 etiquetas de búsqueda relevantes'),
});

const PUBLISH_VERBS =
  /\b(vendo|venta de|se vende|alquilo|alquiler de|se alquila|ofrezco|ofresco|remato|cambio por|permuto|regalo|dono|dicto clases|clases de|hago\s+\w+|reparo|instalo|servicio de|brindo)\b/i;

const PRICE_PATTERN = /\b(s\/\.?|soles?|\$)\s*\d/i;

/**
 * Heurística rápida: decide si el texto parece una búsqueda o la descripción
 * de un adiso que el usuario quiere publicar.
 */
function detectComposeIntent(text: string): { intent: 'search' | 'publish'; confidence: number } {
  const trimmed = text.trim();
  const hasPublishVerb = PUBLISH_VERBS.test(trimmed);
  const hasPrice = PRICE_PATTERN.test(trimmed);

  if (trimmed.length >= 20 && (hasPublishVerb || hasPrice)) {
    let confidence = 0.6;
    if (hasPublishVerb) confidence += 0.2;
    if (hasPrice) confidence += 0.15;
    return { intent: 'publish', confidence: Math.min(confidence, 0.95) };
  }

  return { intent: 'search', confidence: 0.7 };
}

/**
 * Construye un borrador de adiso sin IA, a partir de heurísticas locales
 * (categoría, precio y términos detectados por el NLU del chatbot).
 */
function buildHeuristicDraft(text: string) {
  const analisis = analizarBusqueda(text);
  const precioMatch = text.match(/(?:s\/\.?|soles?|\$)\s*(\d+(?:[.,]\d+)?)/i);
  const precio = precioMatch ? parseFloat(precioMatch[1].replace(',', '.')) : undefined;

  const titulo = text.trim().slice(0, 80);
  const categoria: Categoria = analisis.categoria || 'productos';

  return {
    titulo,
    descripcion: text.trim(),
    categoria,
    precio,
    tags: analisis.terminos.slice(0, 5),
  };
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const limit = rateLimit(`quick-compose-${ip}`, { windowMs: 60_000, maxRequests: 30 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 });
  }

  try {
    const { text } = bodySchema.parse(await request.json());
    const { intent, confidence } = detectComposeIntent(text);

    if (intent === 'search') {
      return NextResponse.json({ intent, confidence });
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json({ intent, confidence, draft: buildHeuristicDraft(text) });
    }

    try {
      const { object } = await generateObject({
        model: openai(AI_MODELS.ROUTER),
        schema: DraftSchema,
        messages: [
          {
            role: 'system',
            content: `Eres un asistente que ayuda a publicar un adiso en Buscadis.
Un adiso es la publicación de Buscadis. En otros sitios lo llamarían anuncio, aviso o clasificado.
A partir del texto del usuario, genera un borrador claro y atractivo en español y llámalo adiso.
Si el usuario dice anuncio o aviso, entiéndelo como adiso, sin corregirlo de forma brusca.
Si menciona un precio, inclúyelo en soles (S/). Si no hay categoría clara, usa "productos".`,
          },
          { role: 'user', content: text },
        ],
      });

      return NextResponse.json({ intent, confidence, draft: object });
    } catch (aiError) {
      console.error('quick-compose AI error:', aiError);
      return NextResponse.json({ intent, confidence, draft: buildHeuristicDraft(text) });
    }
  } catch (error) {
    console.error('quick-compose error:', error);
    return NextResponse.json({ error: 'Request inválido' }, { status: 400 });
  }
}
