import { generateObject } from 'ai';
import { z } from 'zod';
import { openai, hasOpenAIKey, AI_MODELS } from '@/lib/ai/openai-client';
import { ruedaUseOpenAiApi } from '@/lib/rueda/extraction-policy';

const polishSchema = z.object({
  titulo: z.string().max(100),
  descripcion: z.string().max(1200),
  distrito: z.string().max(80).optional(),
  direccion: z.string().max(120).optional(),
});

export async function aiPolishRuedaListing(raw: {
  texto: string;
  categoria: string;
  telefono: string;
}): Promise<z.infer<typeof polishSchema> | null> {
  if (!ruedaUseOpenAiApi() || !hasOpenAIKey()) return null;

  const { object } = await generateObject({
    model: openai(AI_MODELS.ROUTER),
    schema: polishSchema,
    prompt: `Eres editor de clasificados en Cusco, Perú. A partir del texto extraído de una revista, devuelve JSON.

Reglas:
- titulo: claro, primera línea que enganche, sin teléfonos ni emails, sin fragmentos rotos, máx 90 caracteres.
- descripcion: párrafo ordenado, ortografía correcta, sin teléfonos ni emails (el contacto va por WhatsApp en la app).
- distrito: solo si aparece en el texto (ej. Wanchaq, San Sebastián); si no hay, omite.
- direccion: calle, urb o referencia corta si existe; si no, omite.
- No inventes datos que no estén en el texto.
- Categoría: ${raw.categoria}

Texto:
${raw.texto.slice(0, 2500)}
`,
  });

  return object;
}
