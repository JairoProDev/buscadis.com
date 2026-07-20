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

/**
 * Single Pro plan: publish your digital card + catalog + Pro QR.
 * Creating and editing stay free; paying unlocks going public.
 */
export const PROFILE_PUBLISH_MONTHLY_PEN = 30;

/** @deprecated Use PROFILE_PUBLISH_MONTHLY_PEN — same Pro plan. */
export const PRO_QR_MONTHLY_PRICE_PEN = PROFILE_PUBLISH_MONTHLY_PEN;

export const PROFILE_PUBLISH_FEATURES = [
  'Tu tarjeta de presentación digital pública',
  'Catálogo interactivo y canal de ventas',
  'Enlace único para redes, WhatsApp y QR',
  'Edición ilimitada (IA, formulario y tocar)',
  'QR Pro, analítica y kits para imprimir',
] as const;

export const PRO_QR_FEATURES = PROFILE_PUBLISH_FEATURES;
