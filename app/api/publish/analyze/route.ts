import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { generateObject } from 'ai';
import { hasOpenAIKey, openai, AI_MODELS } from '@/lib/ai/openai-client';
import { analizarBusqueda } from '@/lib/chatbot-nlu';
import { inferCategoryFromText, heuristicSplitAdText } from '@/lib/publish/tiers';
import { inferSubcategoryFromText } from '@/lib/publish/category-tree';
import { detectMissingFields } from '@/lib/publish/publish-draft-types';
import { Categoria } from '@/types';

const bodySchema = z.object({
  text: z.string().max(5000).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  currentDraft: z.record(z.unknown()).optional(),
});

const CATEGORIAS = [
  'empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad',
] as const;

const AnalyzeSchema = z.object({
  titulo: z.string().optional(),
  descripcion: z.string().optional(),
  categoria: z.enum(CATEGORIAS).optional(),
  subcategoria: z.string().optional(),
  contacto: z.string().optional(),
  precio: z.number().optional(),
  tipoPrecio: z.enum(['fijo', 'a_convenir', 'gratis', 'consultar']).optional(),
  ubicacion: z.string().optional(),
  atributos: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

function heuristicAnalyze(text: string) {
  const analisis = analizarBusqueda(text);
  const categoria = (analisis.categoria || inferCategoryFromText(text)) as Categoria;
  const { titulo, descripcion } = heuristicSplitAdText(text);
  const precioMatch = text.match(/(?:s\/\.?|soles?|\$)\s*(\d+(?:[.,]\d+)?)/i);
  const precio = precioMatch ? parseFloat(precioMatch[1].replace(',', '.')) : undefined;
  const contactoMatch = text.match(/(?:\+51|51)?[\s-]?9\d{8}/);
  const subcategoria = inferSubcategoryFromText(categoria, text);

  return {
    titulo: titulo.slice(0, 120),
    descripcion,
    categoria,
    subcategoria,
    precio,
    contacto: contactoMatch?.[0]?.replace(/\D/g, '').replace(/^51/, '') || undefined,
    tipoPrecio: precio ? 'fijo' as const : undefined,
    confidence: {
      categoria: 0.7,
      titulo: 0.75,
      descripcion: 0.8,
      subcategoria: subcategoria ? 0.65 : 0,
      precio: precio ? 0.7 : 0,
      contacto: contactoMatch ? 0.85 : 0,
    },
  };
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const limited = rateLimit(`publish-analyze-${ip}`, { windowMs: 60_000, maxRequests: 20 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const { text, imageUrls } = bodySchema.parse(await request.json());

    let result: z.infer<typeof AnalyzeSchema> & { confidence: Record<string, number> };

    if (text?.trim() && hasOpenAIKey()) {
      try {
        const { object } = await generateObject({
          model: openai(AI_MODELS.REASONING),
          schema: AnalyzeSchema,
          prompt: `Analiza este texto de aviso clasificado peruano y extrae datos estructurados. Texto:\n${text}`,
        });
        const categoria = (object.categoria || inferCategoryFromText(text)) as Categoria;
        result = {
          ...object,
          categoria,
          subcategoria: object.subcategoria || inferSubcategoryFromText(categoria, text),
          confidence: {
            categoria: 0.9,
            titulo: object.titulo ? 0.9 : 0,
            descripcion: object.descripcion ? 0.9 : 0,
            subcategoria: object.subcategoria ? 0.85 : 0.7,
            precio: object.precio ? 0.85 : 0,
            contacto: object.contacto ? 0.9 : 0,
          },
        };
      } catch {
        result = heuristicAnalyze(text);
      }
    } else if (text?.trim()) {
      result = heuristicAnalyze(text);
    } else {
      result = { confidence: {} };
    }

    // Image analysis via analyze-product if image provided
    if (imageUrls?.length) {
      try {
        const authHeader = request.headers.get('authorization') || '';
        const res = await fetch(new URL('/api/analyze-product', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({ imageUrl: imageUrls[0] }),
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          if (data.title && !result.titulo) {
            result.titulo = data.title;
            result.confidence.titulo = 0.85;
          }
          if (data.description && !result.descripcion) {
            result.descripcion = data.description;
            result.confidence.descripcion = 0.85;
          }
          if (data.price && !result.precio) {
            result.precio = data.price;
            result.confidence.precio = 0.8;
          }
          if (data.category && !result.categoria) {
            const catMap: Record<string, Categoria> = {
              bebidas: 'productos', productos: 'productos', empleo: 'empleos', inmueble: 'inmuebles',
            };
            const mapped = catMap[data.category.toLowerCase()] || inferCategoryFromText(data.category);
            result.categoria = mapped;
            result.confidence.categoria = 0.75;
          }
        }
      } catch {
        // image analysis optional
      }
    }

    const draft = {
      titulo: result.titulo,
      descripcion: result.descripcion,
      categoria: result.categoria,
      subcategoria: result.subcategoria,
      contacto: result.contacto,
      precio: result.precio,
      tipoPrecio: result.tipoPrecio,
      ubicacion: result.ubicacion,
      atributos: result.atributos || {},
      imagenes: imageUrls || [],
    };

    const missingFields = detectMissingFields({
      imagenes: imageUrls || [],
      atributos: result.atributos || {},
      aiConfidence: result.confidence,
      missingFields: [],
      chatHistory: [],
      plan: 'paid',
      titulo: result.titulo,
      descripcion: result.descripcion,
      categoria: result.categoria,
      subcategoria: result.subcategoria,
      contacto: result.contacto,
      precio: result.precio,
      tipoPrecio: result.tipoPrecio,
      ubicacion: result.ubicacion,
    });

    return NextResponse.json({
      draft,
      confidence: result.confidence,
      missingFields,
    });
  } catch (e) {
    console.error('[publish/analyze]', e);
    return NextResponse.json({ error: 'Error al analizar' }, { status: 500 });
  }
}
