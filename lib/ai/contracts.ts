import { Adiso, Categoria } from '@/types';

export type AIIntent =
  | 'search'
  | 'publish'
  | 'vision'
  | 'recommend'
  | 'help'
  | 'other';

export interface AIChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  imageUrl?: string;
  context?: {
    category?: Categoria;
    location?: string;
  };
}

export interface SearchResultPayload {
  type: 'search_results';
  items: Adiso[];
  total: number;
}

export interface PublishDraftPayload {
  type: 'publish_draft';
  draft: {
    categoria: Categoria;
    titulo: string;
    descripcion: string;
    precio?: number;
    ubicacion?: string;
    contacto?: string;
    imageUrl?: string;
    confidence: 'low' | 'medium' | 'high';
  };
}

export interface AIRecommendationPayload {
  type: 'recommendations';
  items: Adiso[];
}

export type AIToolPayload =
  | SearchResultPayload
  | PublishDraftPayload
  | AIRecommendationPayload;

export interface AIChatResponse {
  sessionId: string;
  intent: AIIntent;
  confidence: number;
  text: string;
  payload?: AIToolPayload;
  warnings?: string[];
  meta?: {
    provider?: 'openai' | 'gemini' | 'heuristic';
    latencyMs?: number;
    costUsd?: number;
  };
}

export type AIEventName =
  | 'chat.request.received'
  | 'chat.intent.classified'
  | 'chat.tool.executed'
  | 'chat.response.sent'
  | 'chat.error'
  | 'search.executed'
  | 'vision.executed'
  | 'publish.draft.created';
