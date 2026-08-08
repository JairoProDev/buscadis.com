/**
 * Packs Free / Pro / Max — docs/tarjetadigitalbuscadis/10-GTM-VIRALIDAD-Y-PRECIOS.md
 */
import type { SubscriptionTier } from '@/lib/qr/types';

export type PerfilVivoPlanId = 'free' | 'pro' | 'max';

export type PerfilVivoPlan = {
  id: PerfilVivoPlanId;
  nombre: string;
  precioMensualPen: number;
  precioAnualPen: number | null;
  /** subscription_tier en DB */
  tier: SubscriptionTier;
  incluye: readonly string[];
  ancla?: string;
};

export const PROFILE_PUBLISH_MONTHLY_PEN = 30;
export const PROFILE_PUBLISH_YEARLY_PEN = 300;
export const PROFILE_MAX_MONTHLY_PEN = 300;

/** @deprecated Use PROFILE_PUBLISH_MONTHLY_PEN */
export const PRO_QR_MONTHLY_PRICE_PEN = PROFILE_PUBLISH_MONTHLY_PEN;

export const PROFILE_PUBLISH_FEATURES = [
  'Tu tarjeta de presentación digital pública',
  'Catálogo interactivo y canal de ventas',
  'Enlace único para redes, WhatsApp y QR',
  'Edición ilimitada (IA, formulario y tocar)',
  'QR Pro, analítica y kits para imprimir',
] as const;

export const PRO_QR_FEATURES = PROFILE_PUBLISH_FEATURES;

export const PERFIL_VIVO_PLANS: readonly PerfilVivoPlan[] = [
  {
    id: 'free',
    nombre: 'Free',
    precioMensualPen: 0,
    precioAnualPen: null,
    tier: 'free',
    incluye: [
      'Perfil completo con módulos base',
      'Hasta 10 productos',
      'Indexable en Google',
      '1 aviso clasificado',
      'Métricas básicas',
    ],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precioMensualPen: PROFILE_PUBLISH_MONTHLY_PEN,
    precioAnualPen: PROFILE_PUBLISH_YEARLY_PEN,
    tier: 'pro',
    incluye: [
      'Catálogo ilimitado',
      'Novedades, promociones y publicaciones',
      'Personalización completa',
      'Prioridad en buscador y mapa',
      'Panel completo + Deals',
      'Verificación nivel 2',
    ],
    ancla: 'Un programador local cobra ~S/3,000 por una web. El anual es el 10%.',
  },
  {
    id: 'max',
    nombre: 'Max',
    precioMensualPen: PROFILE_MAX_MONTHLY_PEN,
    precioAnualPen: null,
    tier: 'enterprise',
    incluye: [
      'Todo Publicadis',
      'ADIS AI en el perfil',
      'Gestión de contenido y pauta',
      'Verificación nivel 3',
      'Informes y acompañamiento',
    ],
  },
] as const;

export function planIdFromTier(tier: SubscriptionTier): PerfilVivoPlanId {
  if (tier === 'enterprise') return 'max';
  if (tier === 'pro') return 'pro';
  return 'free';
}

export function getSubscriptionTier(profile: {
  subscription_tier?: SubscriptionTier;
}): SubscriptionTier {
  const tier = profile.subscription_tier;
  if (tier === 'pro' || tier === 'enterprise') return tier;
  return 'free';
}

export function canUseProQr(profile: { subscription_tier?: SubscriptionTier }): boolean {
  const tier = getSubscriptionTier(profile);
  return tier === 'pro' || tier === 'enterprise';
}

/**
 * Whether the profile may be made public. Creating and editing are always free;
 * publishing (going public) requires an active subscription.
 */
export function canPublishProfile(profile: {
  subscription_tier?: SubscriptionTier;
}): boolean {
  return getSubscriptionTier(profile) !== 'free';
}

export function canUsePerfilVivoIa(profile: {
  subscription_tier?: SubscriptionTier;
}): boolean {
  return getSubscriptionTier(profile) === 'enterprise';
}
