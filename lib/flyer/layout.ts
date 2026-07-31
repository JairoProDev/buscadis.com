import type { Adiso, Categoria } from '@/types';
import {
  formatPrecioDisplay,
  formatUbicacionCorta,
  getCategoriaLabel,
  toDisplayTitle,
} from '@/lib/adiso-display';
import {
  DEFAULT_FLYER_TEMPLATE,
  type FlyerConfig,
  type FlyerContent,
  type FlyerTemplateId,
} from './types';
import { defaultFlyerForCategory, isFlyerTemplateId, resolveFlyerConfig } from './templates';

export function truncateFlyerTitle(title: string, max = 72): string {
  const t = title.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildFlyerContent(input: {
  titulo?: string | null;
  precio?: number | null;
  moneda?: string | null;
  tipoPrecio?: string | null;
  ubicacion?: Adiso['ubicacion'];
  categoria?: Categoria | string | null;
}): FlyerContent {
  const fakeAdiso = {
    titulo: input.titulo || 'Tu aviso',
    precio: input.precio ?? undefined,
    moneda: (input.moneda as Adiso['moneda']) || 'PEN',
    tipoPrecio: input.tipoPrecio as Adiso['tipoPrecio'],
    ubicacion: input.ubicacion,
    categoria: (input.categoria as Categoria) || 'productos',
  } as Adiso;

  const title = toDisplayTitle(fakeAdiso.titulo) || fakeAdiso.titulo || 'Aviso en Buscadis';
  const categoria = fakeAdiso.categoria;
  return {
    title,
    priceLabel: formatPrecioDisplay(fakeAdiso),
    locationLabel: formatUbicacionCorta(fakeAdiso.ubicacion) || null,
    categoryLabel: getCategoriaLabel(categoria),
    categoria,
  };
}

export function buildFlyerContentFromAdiso(adiso: Adiso): FlyerContent {
  const priv =
    adiso.privateData && typeof adiso.privateData === 'object'
      ? (adiso.privateData as Record<string, unknown>)
      : {};
  const precio =
    adiso.precio ??
    (typeof priv.precio === 'number' ? priv.precio : undefined);
  const ubicacion =
    adiso.ubicacion ??
    (priv.ubicacion as Adiso['ubicacion'] | undefined);

  return buildFlyerContent({
    titulo: adiso.titulo,
    precio,
    moneda: adiso.moneda || (priv.moneda as string | undefined),
    tipoPrecio: adiso.tipoPrecio,
    ubicacion,
    categoria: adiso.categoria,
  });
}

/**
 * Resolve flyer template/config for an ad.
 * Existing ads without flyer metadata get a stable category-based default
 * (hashed by id so the feed has visual variety).
 */
export function flyerStateFromPrivateData(
  privateData: Record<string, unknown> | undefined | null,
  opts?: { categoria?: Categoria | string; adisoId?: string }
): {
  templateId: FlyerTemplateId;
  config: FlyerConfig;
} {
  const priv = privateData || {};
  if (isFlyerTemplateId(priv.flyerTemplateId)) {
    const rawConfig =
      priv.flyerConfig && typeof priv.flyerConfig === 'object'
        ? (priv.flyerConfig as FlyerConfig)
        : {};
    return {
      templateId: priv.flyerTemplateId,
      config: resolveFlyerConfig(opts?.categoria, priv.flyerTemplateId, rawConfig),
    };
  }

  const base = defaultFlyerForCategory(opts?.categoria);
  // Stable variety for legacy ads: pick among templates by id hash
  const templateId = pickLegacyTemplate(opts?.adisoId, opts?.categoria) || base.templateId;
  return {
    templateId,
    config: resolveFlyerConfig(opts?.categoria, templateId, base.config),
  };
}

function pickLegacyTemplate(
  adisoId: string | undefined,
  categoria?: Categoria | string
): FlyerTemplateId {
  const pool: FlyerTemplateId[] =
    categoria === 'empleos' || categoria === 'servicios' || categoria === 'negocios'
      ? ['negocio', 'minimal-cream', 'split', 'marketplace-tag']
      : categoria === 'eventos'
        ? ['gradient-dusk', 'diagonal-band', 'bold-type', 'marketplace-tag']
        : ['bold-type', 'diagonal-band', 'urgent', 'split', 'marketplace-tag', 'gradient-dusk'];

  if (!adisoId) return pool[0];
  let hash = 0;
  for (let i = 0; i < adisoId.length; i++) {
    hash = (hash * 31 + adisoId.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length] || DEFAULT_FLYER_TEMPLATE;
}

export { resolveFlyerConfig, isFlyerTemplateId, defaultFlyerForCategory };
export { DEFAULT_FLYER_TEMPLATE } from './types';
