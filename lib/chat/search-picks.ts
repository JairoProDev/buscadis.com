import { Adiso } from '@/types';
import { formatPrecioDisplay, formatUbicacionCorta } from '@/lib/adiso-display';

export const SEARCH_PICKS_LIMIT = 3;

const RANK_LABELS = ['Mejor opción', 'Muy buena opción', 'Alternativa sólida'] as const;

export function getSearchPicks(items: Adiso[], limit = SEARCH_PICKS_LIMIT): Adiso[] {
  return items.slice(0, limit);
}

export function buildSearchIntroMessage(total: number, query: string): string {
  const q = query.trim();
  if (total === 0) {
    return q
      ? `No encontré avisos claros para «${q}». Puedo ampliar la búsqueda si me das más detalle (zona, presupuesto o tipo).`
      : 'No encontré resultados. Cuéntame qué buscas con un poco más de detalle.';
  }

  if (total === 1) {
    return `Encontré 1 aviso que encaja con «${q}». Te lo resumo abajo para que decidas rápido:`;
  }

  const shown = Math.min(total, SEARCH_PICKS_LIMIT);
  return `Revisé ${total} avisos sobre «${q}». Te destaco las ${shown} mejores opciones según relevancia, precio y calidad del anuncio:`;
}

export function getPickRankLabel(index: number): string {
  return RANK_LABELS[index] ?? `Opción ${index + 1}`;
}

export function getAdisoImageUrl(adiso: Adiso): string | null {
  return adiso.imagenesUrls?.[0] ?? adiso.imagenUrl ?? null;
}

export function getPickReason(adiso: Adiso, index: number, picks: Adiso[]): string {
  const reasons: string[] = [];

  if (index === 0) {
    reasons.push('Mayor coincidencia con tu búsqueda');
  }

  if (adiso.esDestacado || adiso.promotionTier) {
    reasons.push('Anuncio destacado');
  }

  if (getAdisoImageUrl(adiso)) {
    reasons.push('Incluye fotos');
  }

  const price = adiso.precio;
  if (price != null && price > 0) {
    const prices = picks.map((p) => p.precio).filter((p): p is number => p != null && p > 0);
    if (prices.length > 1 && price === Math.min(...prices)) {
      reasons.push('Mejor precio entre las opciones');
    }
  }

  const location = formatUbicacionCorta(adiso.ubicacion);
  if (location) {
    reasons.push(location);
  }

  if (adiso.vendedor?.esVerificado) {
    reasons.push('Vendedor verificado');
  }

  if (adiso.descripcion && adiso.descripcion.length > 80) {
    reasons.push('Descripción detallada');
  }

  return reasons.slice(0, 2).join(' · ') || 'Buena coincidencia con lo que pediste';
}

export function buildSearchComparisonHint(picks: Adiso[]): string | null {
  if (picks.length < 2) return null;

  const priced = picks.filter((p) => p.precio != null && p.precio > 0);
  if (priced.length >= 2) {
    const min = Math.min(...priced.map((p) => p.precio!));
    const max = Math.max(...priced.map((p) => p.precio!));
    if (max > min * 1.15) {
      return `Los precios van de S/ ${min.toLocaleString('es-PE')} a S/ ${max.toLocaleString('es-PE')}. ¿Quieres que priorice los más económicos?`;
    }
  }

  return '¿Te ayudo a comparar por zona, precio o si tienen fotos?';
}

export function formatPickPrice(adiso: Adiso): string {
  return formatPrecioDisplay(adiso) ?? 'Consultar precio';
}
