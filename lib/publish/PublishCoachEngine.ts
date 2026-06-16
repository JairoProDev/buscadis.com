import type { PublishChatStepId } from '@/lib/publish/chat-steps';

export type CoachIntent =
  | 'structured_answer'
  | 'needs_ai'
  | 'off_topic'
  | 'help_request';

export interface CoachEvaluation {
  intent: CoachIntent;
  message?: string;
  escalateToAI: boolean;
  reason?: string;
}

const HELP_PATTERNS = [
  /\b(c[uó]anto|c[oó]mo|qu[eé]|ayuda|consejo|recomiend|suger)/i,
  /\b(precio|redact|escrib|mejorar|t[ií]tulo|descripci)/i,
];

const OFF_TOPIC = [
  /\b(clima|pol[ií]tica|f[uú]tbol|noticia)/i,
];

export function evaluatePublishInput(
  step: PublishChatStepId,
  text: string,
  attemptCount = 0,
): CoachEvaluation {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      intent: 'structured_answer',
      message: 'Escribe algo para continuar.',
      escalateToAI: false,
    };
  }

  if (HELP_PATTERNS.some((p) => p.test(trimmed))) {
    return {
      intent: 'help_request',
      escalateToAI: true,
      reason: 'user_asked_advice',
      message: 'Te ayudo a redactar mejor tu aviso.',
    };
  }

  if (OFF_TOPIC.some((p) => p.test(trimmed))) {
    return {
      intent: 'off_topic',
      message: 'Sigamos con tu publicación — cuéntame sobre lo que quieres anunciar.',
      escalateToAI: false,
    };
  }

  if (step === 'titulo' && trimmed.length < 8) {
    return {
      intent: 'needs_ai',
      escalateToAI: attemptCount >= 1,
      reason: 'title_too_short',
      message: 'Un título un poco más descriptivo ayuda a que te encuentren.',
    };
  }

  if (step === 'descripcion' && trimmed.length < 20) {
    return {
      intent: 'needs_ai',
      escalateToAI: attemptCount >= 1,
      reason: 'description_too_short',
      message: 'Agrega más detalles: estado, ubicación aproximada o condiciones.',
    };
  }

  if (attemptCount >= 2) {
    return {
      intent: 'needs_ai',
      escalateToAI: true,
      reason: 'repeated_failures',
    };
  }

  return {
    intent: 'structured_answer',
    escalateToAI: false,
  };
}

export const PUBLISH_COACH_SYSTEM_PROMPT = `Eres un consultor experto en avisos clasificados en Perú (Buscadis).
Ayudas al usuario a publicar empleos, inmuebles, vehículos, servicios y productos.
Sé breve, práctico y en español peruano neutro. No busques anuncios — solo mejora la publicación.`;
