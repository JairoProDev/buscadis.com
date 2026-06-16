import { DealPromotionTier } from '@/types';

export const DEAL_TIER_ORDER: Record<DealPromotionTier, number> = {
  premium: 0,
  destacada: 1,
  gratis: 2,
};

export const DEAL_TIER_HOURS: Record<DealPromotionTier, number> = {
  gratis: 24,
  destacada: 72,
  premium: 168,
};

export const DEAL_TIER_PRICE_PEN: Record<DealPromotionTier, number> = {
  gratis: 0,
  destacada: 5,
  premium: 9,
};

export function dealVisibleUntilIso(tier: DealPromotionTier, from = Date.now()): string {
  const hours = DEAL_TIER_HOURS[tier];
  return new Date(from + hours * 60 * 60 * 1000).toISOString();
}

export function dealTierPrice(tier: DealPromotionTier): number {
  return DEAL_TIER_PRICE_PEN[tier];
}

export function isPaidDealTier(tier: DealPromotionTier): boolean {
  return tier !== 'gratis';
}

export const DEAL_FEED_PAGE_SIZE = 10;

/** HLS transcoding — enable when MUX_CLOUDFLARE configured (Fase 1.5) */
export function isDealHlsEnabled(): boolean {
  return Boolean(process.env.MUX_TOKEN_ID || process.env.CLOUDFLARE_STREAM_TOKEN);
}
