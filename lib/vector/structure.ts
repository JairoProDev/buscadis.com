/**
 * Vector engine — structuring.
 *
 * Turns understood artifacts + the current profile into a schema-shaped draft:
 * profile patch, catalog product drafts, confidence/provenance, missing fields
 * and skippable follow-up questions. Uses Gemini structured extraction.
 */
import { structuredExtract } from '@/lib/ai/gemini';
import { VectorDraftSchema, type VectorDraft } from './schema';
import type { StructureInput } from './types';

const SYSTEM_PROMPT = `Eres Adis, un asistente humano y cálido que ayuda a dueños de negocios en Perú a crear su tarjeta de presentación digital (perfil + catálogo) en Buscadis.

Tu trabajo: analizar TODO lo que el usuario comparte (texto, audios transcritos, documentos, imágenes descritas, enlaces) de forma minuciosa, sin perder ningún detalle, e inferir/extrapolar de forma razonable para llenar el esquema del negocio.

Reglas:
- Extrae nombre, un "slug" (usuario) apropiado en minúsculas-con-guiones, tagline corto, descripción atractiva, contactos (whatsapp, teléfono, email, dirección), redes sociales, horarios, categorías y productos.
- Para cada producto detectado, incluye título, descripción, precio y moneda (PEN por defecto), categoría, marca y atributos si están disponibles.
- Usa "confidence" (0..1) por campo del perfil y "provenance" (de qué fuente salió).
- Si un dato NO está presente, NO lo inventes: déjalo fuera y agrégalo a "missingFields" y a "followUpQuestions".
- "followUpQuestions" deben ser preguntas breves, amables y OMITIBLES, para enriquecer el perfil (ej: "¿Quieres agregar tu horario de atención?").
- "reply" es tu mensaje al usuario: cálido, humano, en español, resume lo que creaste/actualizaste y qué le preguntas a continuación. Guía a usuarios no técnicos (ej: cómo compartir su ubicación).
- Responde SIEMPRE con un único JSON que cumpla el esquema. No incluyas texto fuera del JSON.`;

function buildContext(input: StructureInput): string {
  const { currentProfile, currentProducts, artifacts, userMessage } = input;

  const profileContext = JSON.stringify(
    {
      name: currentProfile.name || null,
      slug: currentProfile.slug || null,
      tagline: currentProfile.tagline || null,
      description: currentProfile.description || null,
      contact_whatsapp: currentProfile.contact_whatsapp || null,
      contact_phone: currentProfile.contact_phone || null,
      contact_email: currentProfile.contact_email || null,
      contact_address: currentProfile.contact_address || null,
      social_links: currentProfile.social_links || [],
      business_hours: currentProfile.business_hours || null,
    },
    null,
    2
  );

  const productContext =
    currentProducts && currentProducts.length
      ? currentProducts.map((p) => `- ${p.title || '(sin título)'} [${p.category || 'sin categoría'}]`).join('\n')
      : '(sin productos aún)';

  const artifactContext = artifacts
    .map((a, i) => {
      const extra = a.extractedJson
        ? `\n  Datos estructurados: ${JSON.stringify(a.extractedJson).slice(0, 1500)}`
        : '';
      return `FUENTE ${i + 1} [${a.kind}] "${a.label}":\n${a.rawText || '(vacío)'}${extra}`;
    })
    .join('\n\n');

  return [
    userMessage ? `MENSAJE DEL USUARIO ESTE TURNO:\n${userMessage}` : '',
    `PERFIL ACTUAL (no sobrescribas datos ya buenos salvo que el usuario lo pida):\n${profileContext}`,
    `PRODUCTOS ACTUALES:\n${productContext}`,
    `NUEVAS FUENTES A ANALIZAR:\n${artifactContext || '(ninguna)'}`,
    'Devuelve el JSON con perfil, productos, confidence, provenance, missingFields y followUpQuestions.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Run structuring. Falls back to an empty draft with a helpful reply if the
 * model is unavailable or returns unusable output.
 */
export async function structureArtifacts(input: StructureInput): Promise<VectorDraft> {
  const context = buildContext(input);

  try {
    const draft = await structuredExtract<VectorDraft>([context], VectorDraftSchema, {
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0.3,
    });
    if (!draft.reply) {
      draft.reply = 'Listo, revisé lo que me enviaste y actualicé tu perfil.';
    }
    return draft;
  } catch (e) {
    console.error('structureArtifacts error:', (e as Error).message);
    return VectorDraftSchema.parse({
      reply:
        'Recibí tu información pero tuve un problema al procesarla por completo. ' +
        '¿Puedes contarme el nombre de tu negocio y a qué se dedica?',
      missingFields: ['name', 'description'],
      followUpQuestions: [
        { id: 'name', question: '¿Cómo se llama tu negocio?', field: 'name' },
        { id: 'desc', question: '¿A qué se dedica?', field: 'description' },
      ],
    });
  }
}
