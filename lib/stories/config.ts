import { StoryObjective, StoryPromotionTier, StorySource, StoryStatus } from '@/types';

export const STORY_TIER_ORDER: Record<StoryPromotionTier, number> = {
  premium: 0,
  destacada: 1,
  gratis: 2,
};

export const STORY_TIER_HOURS: Record<StoryPromotionTier, number> = {
  gratis: 1,
  destacada: 24,
  premium: 48,
};

export const STORY_TIER_PRICE_PEN: Record<StoryPromotionTier, number> = {
  gratis: 0,
  destacada: 5,
  premium: 9,
};

export const STORY_TIER_INFO: Record<
  StoryPromotionTier,
  { nombre: string; descripcion: string }
> = {
  gratis: {
    nombre: 'Gratis',
    descripcion: 'Visible 1 hora en el carril. Queda guardada en tu perfil para republicar.',
  },
  destacada: {
    nombre: 'Destacada',
    descripcion: '24 horas visibles, anillo dorado y mejor posición.',
  },
  premium: {
    nombre: 'Premium',
    descripcion: '48 horas visibles, primer lugar y anillo premium.',
  },
};

export const STORY_OBJECTIVES: Record<
  StoryObjective,
  { label: string; description: string; primaryCta: string }
> = {
  ventas: {
    label: 'Vender',
    description: 'Prioriza ver el adiso y contactar al vendedor.',
    primaryCta: 'Ver adiso',
  },
  clicks: {
    label: 'Atraer visitas',
    description: 'Mide clics al adiso vinculado.',
    primaryCta: 'Ver adiso',
  },
  contactos: {
    label: 'Conseguir contactos',
    description: 'Prioriza WhatsApp y chat interno.',
    primaryCta: 'Contactar',
  },
};

export function storyVisibleUntilIso(tier: StoryPromotionTier, from = Date.now()): string {
  const hours = STORY_TIER_HOURS[tier];
  return new Date(from + hours * 60 * 60 * 1000).toISOString();
}

export function storyTierPrice(tier: StoryPromotionTier): number {
  return STORY_TIER_PRICE_PEN[tier];
}

export function isPaidStoryTier(tier: StoryPromotionTier): boolean {
  return tier !== 'gratis';
}

export function adisoTierToStoryTier(
  adisoTier: StoryPromotionTier | string | undefined | null
): StoryPromotionTier {
  if (adisoTier === 'premium' || adisoTier === 'destacada') return adisoTier;
  return 'gratis';
}

export const DEFAULT_STORY_STATUS: StoryStatus = 'active';
export const DEFAULT_STORY_SOURCE: StorySource = 'manual';
export const DEFAULT_STORY_OBJECTIVE: StoryObjective = 'contactos';
