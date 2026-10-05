import type { SalesOpportunityWithAdiso } from './types';

export type SuggestReplyIntent =
  | 'first_contact'
  | 'follow_up'
  | 'proposal'
  | 'objection'
  | 'close';

const INTENT_LABELS: Record<SuggestReplyIntent, string> = {
  first_contact: 'primer contacto (Rueda / Buscadis)',
  follow_up: 'seguimiento amable',
  proposal: 'enviar propuesta de plan',
  objection: 'responder objeción',
  close: 'cierre y pago',
};

export function buildSuggestReplyPrompt(
  opp: SalesOpportunityWithAdiso,
  intent: SuggestReplyIntent,
  adisoDescription?: string,
): string {
  const lines = [
    'Eres asistente comercial de Buscadis (marketplace + avisos destacados en Cusco, Perú).',
    'Redacta un mensaje corto para WhatsApp en español peruano, profesional y cercano.',
    'NO inventes precios si no están en el contexto; ofrece planes genéricos (destacado 7d, mensual) solo si encaja.',
    'Incluye CTA claro (responder, enviar flyer, agendar llamada).',
    'Máximo 6 líneas. Sin markdown.',
    '',
    `Intención: ${INTENT_LABELS[intent]}`,
    `Etapa pipeline: ${opp.stage_id}`,
    `Título lead: ${opp.title}`,
  ];
  if (opp.business_name) lines.push(`Negocio: ${opp.business_name}`);
  if (opp.contact_whatsapp) lines.push(`WhatsApp: ${opp.contact_whatsapp}`);
  if (opp.amount_pen) lines.push(`Monto acordado/ref: S/ ${opp.amount_pen}`);
  if (opp.plan_tier) lines.push(`Plan: ${opp.plan_tier}`);
  if (opp.notes) lines.push(`Notas internas: ${opp.notes}`);
  if (opp.adiso?.titulo) lines.push(`Aviso Rueda: ${opp.adiso.titulo}`);
  if (adisoDescription) lines.push(`Descripción aviso: ${adisoDescription.slice(0, 800)}`);
  return lines.join('\n');
}

export async function suggestWhatsAppReply(
  opp: SalesOpportunityWithAdiso,
  intent: SuggestReplyIntent,
  adisoDescription?: string,
): Promise<string> {
  const prompt = buildSuggestReplyPrompt(opp, intent, adisoDescription);

  try {
    const { generateText } = await import('ai');
    const { openai, hasOpenAIKey, AI_MODELS } = await import('@/lib/ai/openai-client');
    if (!hasOpenAIKey()) return fallbackDraft(opp, intent);
    const { text } = await generateText({
      model: openai(AI_MODELS.ROUTER),
      prompt,
    });
    return text.trim() || fallbackDraft(opp, intent);
  } catch {
    return fallbackDraft(opp, intent);
  }
}

function fallbackDraft(opp: SalesOpportunityWithAdiso, intent: SuggestReplyIntent): string {
  const name = opp.business_name || opp.contact_name || 'estimado/a';
  if (intent === 'first_contact') {
    return `Hola ${name}, soy del equipo Buscadis. Vimos su aviso y podemos destacarlo en buscadis.com para que más personas lo contacten por WhatsApp. ¿Le envío una propuesta en 1 minuto?`;
  }
  if (intent === 'follow_up') {
    return `Hola ${name}, le escribo de nuevo desde Buscadis por su aviso. ¿Tuvo chance de revisar? Quedo atento para publicarlo hoy mismo.`;
  }
  if (intent === 'proposal') {
    return `Hola ${name}, plan destacado: su aviso primero en empleos + historia 7 días desde S/15. Incluye flyer si lo tiene. ¿Le parece si coordinamos el pago y lo subimos hoy?`;
  }
  return `Hola ${name}, ¿en qué puedo ayudarle con la publicación en Buscadis?`;
}
