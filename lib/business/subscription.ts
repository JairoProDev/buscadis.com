import type { BusinessProfile } from '@/types/business';
import type { SubscriptionTier } from '@/lib/qr/types';

export function getSubscriptionTier(profile: Partial<BusinessProfile>): SubscriptionTier {
  const tier = (profile as { subscription_tier?: SubscriptionTier }).subscription_tier;
  if (tier === 'pro' || tier === 'enterprise') return tier;
  return 'free';
}

export function canUseProQr(profile: Partial<BusinessProfile>): boolean {
  const tier = getSubscriptionTier(profile);
  return tier === 'pro' || tier === 'enterprise';
}

/**
 * Whether the profile may be made public. Creating and editing are always free;
 * publishing (going public) requires an active subscription.
 */
export function canPublishProfile(profile: Partial<BusinessProfile>): boolean {
  return getSubscriptionTier(profile) !== 'free';
}

/** Monthly price to publish a Buscadis profile (digital card + catalog). */
export const PROFILE_PUBLISH_MONTHLY_PEN = 30;

export const PRO_QR_MONTHLY_PRICE_PEN = 29;

export const PRO_QR_FEATURES = [
  'Gradientes y formas avanzadas',
  'Plantillas para redes e impresión',
  'Kits phygital (cartel, tarjeta, sticker Pro)',
  'Analítica de escaneos y conversiones',
  'Exportación PDF y PNG hasta 2048px',
] as const;
