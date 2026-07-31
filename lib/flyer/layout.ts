import type { Adiso, Categoria } from '@/types';
import {
  formatPrecioDisplay,
  formatUbicacionCorta,
  getCategoriaLabel,
  toDisplayTitle,
} from '@/lib/adiso-display';
import { DEFAULT_FLYER_TEMPLATE, type FlyerConfig, type FlyerContent, type FlyerTemplateId } from './types';
import { isFlyerTemplateId, resolveFlyerConfig } from './templates';

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
  return buildFlyerContent({
    titulo: adiso.titulo,
    precio: adiso.precio,
    moneda: adiso.moneda,
    tipoPrecio: adiso.tipoPrecio,
    ubicacion: adiso.ubicacion,
    categoria: adiso.categoria,
  });
}

export function flyerStateFromPrivateData(privateData: Record<string, unknown> | undefined | null): {
  templateId: FlyerTemplateId;
  config: FlyerConfig;
} {
  const priv = privateData || {};
  const templateId = isFlyerTemplateId(priv.flyerTemplateId)
    ? priv.flyerTemplateId
    : DEFAULT_FLYER_TEMPLATE;
  const rawConfig =
    priv.flyerConfig && typeof priv.flyerConfig === 'object'
      ? (priv.flyerConfig as FlyerConfig)
      : {};
  return {
    templateId,
    config: resolveFlyerConfig(undefined, templateId, rawConfig),
  };
}

export { resolveFlyerConfig, isFlyerTemplateId, DEFAULT_FLYER_TEMPLATE };
