/** Dimensiones del carril de historias (proporción ~9:16, estilo Facebook/WhatsApp) */
export const STORY_RAIL = {
  cardW: { mobile: 108, desktop: 118 },
  cardH: { mobile: 192, desktop: 210 },
  gap: 8,
  radius: 12,
  avatar: { mobile: 32, desktop: 36 },
  plusBtn: 32,
} as const;

export type StoryRingTier = 'premium' | 'destacada' | 'gratis';

export function ringClassFor(tier: StoryRingTier, unseen: boolean): string {
  if (!unseen) return 'bg-[var(--border-color)]';
  switch (tier) {
    case 'premium':
      return 'bg-gradient-to-tr from-[var(--brand-blue)] via-[var(--brand-yellow)] to-[var(--brand-blue)]';
    case 'destacada':
      return 'bg-[var(--brand-yellow)]';
    default:
      return 'bg-[var(--brand-blue)]';
  }
}
