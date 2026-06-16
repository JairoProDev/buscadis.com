export type ChatIntent = 'search' | 'publish' | 'help' | 'open_adiso' | 'unknown';

export interface ChatRouteResult {
  intent: ChatIntent;
  searchQuery?: string;
  publishText?: string;
  adisoId?: string;
  useAI: boolean;
}

const SEARCH_PATTERNS = [
  /\b(busco|buscar|necesito|quiero|hay|encuentra|mu[eé]strame|dame)\b/i,
  /\b(depa|casa|auto|trabajo|empleo|servicio)\b/i,
];

const PUBLISH_PATTERNS = [
  /\b(publicar|vender|alquilar|ofrecer|anunciar|publico)\b/i,
];

const HELP_PATTERNS = [/\b(ayuda|c[oó]mo funciona|qu[eé] es buscadis)\b/i];

export function routeChatMessage(message: string, hasImage = false): ChatRouteResult {
  const text = message.trim();
  if (!text && !hasImage) {
    return { intent: 'unknown', useAI: true };
  }

  if (HELP_PATTERNS.some((p) => p.test(text))) {
    return { intent: 'help', useAI: true };
  }

  if (PUBLISH_PATTERNS.some((p) => p.test(text))) {
    return { intent: 'publish', publishText: text, useAI: text.length > 120 };
  }

  if (SEARCH_PATTERNS.some((p) => p.test(text)) || text.length >= 3) {
    return { intent: 'search', searchQuery: text, useAI: false };
  }

  return { intent: 'unknown', useAI: true };
}
