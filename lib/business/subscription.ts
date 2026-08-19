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

/** Free: pasillo / muestra — tope duro de productos activos. */
export const FREE_PRODUCT_CAP = 10;

export const PROFILE_PUBLISH_FEATURES = [
  'Tu vitrina pública en el centro comercial Buscadis',
  'Catálogo interactivo y canal de pedidos',
  'Enlace único para redes, WhatsApp y QR (dueño)',
  'Edición ilimitada (IA, formulario y tocar)',
  'QR Pro, analítica de pedidos e intents',
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
      'Muestra en el pasillo (perfil básico)',
      `Hasta ${FREE_PRODUCT_CAP} productos`,
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
      'Alquiler de vitrina (local digital)',
      'Catálogo ilimitado + pedidos por WhatsApp',
      'Novedades, promociones y publicaciones',
      'Prioridad en buscador y mapa',
      'Panel de pedidos + Deals',
      'Verificación nivel 2',
    ],
    ancla:
      'Como alquilar un local: vitrina + pasillos (mapa/search) + vendedor (pedidos). Un site a medida cuesta miles.',
  },
  {
    id: 'max',
    nombre: 'Max',
    precioMensualPen: PROFILE_MAX_MONTHLY_PEN,
    precioAnualPen: null,
    tier: 'enterprise',
    incluye: [
      'Local ancla + personal digital 24/7',
      'ADIS AI recepcionista/vendedor en el perfil',
      'Checkout en línea y autoservicio',
      'Gestión de contenido y pauta',
      'Verificación nivel 3 + acompañamiento',
    ],
    ancla:
      'Reemplaza vitrina + recepcionista + volanteo: la IA atiende, cotiza y toma pedidos.',
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

/** Pedidos / carrito / reservas estructurados — Pro+. */
export function canUseCommerceOrders(profile: {
  subscription_tier?: SubscriptionTier;
}): boolean {
  const tier = getSubscriptionTier(profile);
  return tier === 'pro' || tier === 'enterprise';
}

/** Checkout MP / agente LLM del local — Max. */
export function canUseCommerceCheckout(profile: {
  subscription_tier?: SubscriptionTier;
}): boolean {
  return getSubscriptionTier(profile) === 'enterprise';
}

/** Prioridad en search/mapa — Pro+. */
export function hasSearchMapPriority(profile: {
  subscription_tier?: SubscriptionTier;
}): boolean {
  return canUseCommerceOrders(profile);
}

export function freeProductCapReached(
  profile: { subscription_tier?: SubscriptionTier },
  activeProductCount: number
): boolean {
  if (getSubscriptionTier(profile) !== 'free') return false;
  return activeProductCount >= FREE_PRODUCT_CAP;
}

/** @deprecated Use PROFILE_PUBLISH_MONTHLY_PEN */
export const PRO_QR_MONTHLY_PRICE_PEN = PROFILE_PUBLISH_MONTHLY_PEN;
