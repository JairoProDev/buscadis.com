import { TamañoPaquete } from '@/types';

export type PublishTier = 'free' | 'paid';

export interface PublishFeatures {
  auto_reply: boolean;
  ai_enhanced: boolean;
  flyer: boolean;
  interest_campaign: boolean;
  max_images: number;
  max_title_chars: number;
  max_desc_chars: number;
  story_priority: boolean;
}

export const FREE_TIER_LIMITS = {
  durationHours: 24,
  storyDurationHours: 1,
  maxImages: 1,
  maxTitleChars: 140,
  maxDescChars: 100,
  aiCompose: false,
  autoReply: false,
  flyer: false,
  interestCampaign: false,
  storyPriority: false,
} as const;

export const PAID_TIER_DEFAULT: TamañoPaquete = 'miniatura';

export function featuresForTier(tier: PublishTier, packageTier?: TamañoPaquete): PublishFeatures {
  if (tier === 'free') {
    return {
      auto_reply: false,
      ai_enhanced: false,
      flyer: false,
      interest_campaign: false,
      max_images: FREE_TIER_LIMITS.maxImages,
      max_title_chars: FREE_TIER_LIMITS.maxTitleChars,
      max_desc_chars: FREE_TIER_LIMITS.maxDescChars,
      story_priority: false,
    };
  }

  const imagesByPackage: Record<TamañoPaquete, number> = {
    miniatura: 0,
    pequeño: 1,
    mediano: 3,
    grande: 5,
    gigante: 10,
  };

  const pkg = packageTier || PAID_TIER_DEFAULT;

  return {
    auto_reply: true,
    ai_enhanced: true,
    flyer: true,
    interest_campaign: true,
    max_images: imagesByPackage[pkg],
    max_title_chars: 120,
    max_desc_chars: 2000,
    story_priority: pkg !== 'miniatura',
  };
}

export function expiresAtForTier(tier: PublishTier): string | null {
  if (tier === 'free') {
    return new Date(Date.now() + FREE_TIER_LIMITS.durationHours * 60 * 60 * 1000).toISOString();
  }
  return null;
}

/** Split raw text into title + description without LLM */
export function heuristicSplitAdText(raw: string): { titulo: string; descripcion: string } {
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) return { titulo: '', descripcion: '' };

  const sentenceEnd = text.search(/[.!?]\s/);
  if (sentenceEnd > 10 && sentenceEnd < 80) {
    return {
      titulo: text.slice(0, sentenceEnd + 1).trim(),
      descripcion: text.slice(sentenceEnd + 1).trim() || text,
    };
  }

  if (text.length <= 60) {
    return { titulo: text, descripcion: text };
  }

  const cut = text.lastIndexOf(' ', 60);
  const at = cut > 20 ? cut : 60;
  return {
    titulo: text.slice(0, at).trim(),
    descripcion: text.trim(),
  };
}

export function inferCategoryFromText(text: string): string {
  const t = text.toLowerCase();
  if (/\b(alquil|departamento|casa|terreno|inmueble|habitaci)/.test(t)) return 'inmuebles';
  if (/\b(auto|moto|carro|vehiculo|camioneta)/.test(t)) return 'vehiculos';
  if (/\b(empleo|trabajo|vacante|sueldo)/.test(t)) return 'empleos';
  if (/\b(servicio|repar|instal)/.test(t)) return 'servicios';
  if (/\b(evento|fiesta|concierto|entrada)/.test(t)) return 'eventos';
  if (/\b(negocio|empresa|local comercial)/.test(t)) return 'negocios';
  if (/\b(comunidad|grupo|volunt)/.test(t)) return 'comunidad';
  return 'productos';
}
