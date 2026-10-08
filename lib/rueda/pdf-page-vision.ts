import { generateObject } from 'ai';
import { z } from 'zod';
import { openai, hasOpenAIKey, AI_MODELS } from '@/lib/ai/openai-client';
import { ruedaUseOpenAiApi } from '@/lib/rueda/extraction-policy';

const visionAdSchema = z.object({
  anuncios: z.array(
    z.object({
      titulo: z.string().max(100),
      descripcion: z.string().max(1500),
      telefonos: z.array(z.string()).max(4),
      categoria: z
        .enum(['empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'negocios', 'eventos'])
        .optional(),
    }),
  ),
});

export type VisionExtractedAd = z.infer<typeof visionAdSchema>['anuncios'][number];

/**
 * Extrae avisos de una página renderizada (texto en imagen / capas no seleccionables).
 */
export async function extractRuedaAdsFromPagePng(
  pngBase64: string,
  pageNum: number,
): Promise<VisionExtractedAd[]> {
  if (!ruedaUseOpenAiApi() || !hasOpenAIKey()) return [];

  const { object } = await generateObject({
    model: openai(AI_MODELS.VISION),
    schema: visionAdSchema,
    messages: [
      {
        role: 'system',
        content: `Eres un digitador experto de la revista "Rueda de Negocios" (Cusco, Perú).
Lee la página completa (columnas, titulares, cuerpos y teléfonos) y devuelve cada aviso clasificado por separado.

Reglas:
- Un aviso = una oferta (empleo, alquiler, venta, servicio) con al menos un celular peruano 9 dígitos.
- Copia el texto fielmente; corrige solo errores obvios de OCR.
- No inventes teléfonos ni direcciones que no se vean.
- titulo: primera línea útil, sin teléfonos.
- descripcion: resto del aviso, sin teléfonos en el texto (van en telefonos[]).
- Página ${pageNum}.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: `data:image/png;base64,${pngBase64}`,
          },
          {
            type: 'text',
            text: 'Lista todos los avisos visibles en esta página.',
          },
        ],
      },
    ],
  });

  return object.anuncios.filter((a) => a.telefonos.some((t) => /^9\d{8}$/.test(t.replace(/\D/g, '').slice(-9))));
}
