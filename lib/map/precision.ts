import type { Categoria } from '@/types';
import type { MapPrecision } from '@/lib/map/types';

/** Negocios y eventos con local fijo se muestran en el punto. El resto, zona. */
const EXACT_CATEGORIES = new Set<Categoria>(['negocios', 'eventos']);

export function precisionFor(categoria: Categoria, source: 'exact' | 'area'): MapPrecision {
  if (source === 'area') return 'area';
  return EXACT_CATEGORIES.has(categoria) ? 'exact' : 'area';
}

function hash32(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Desplaza el pin de forma estable (mismo anuncio = mismo punto) para no revelar la puerta
 * y para que varios avisos del mismo distrito no se apilen.
 */
export function displayCoordinate(
  id: string,
  lat: number,
  lng: number,
  precision: MapPrecision,
): { lat: number; lng: number } {
  const h = hash32(id);
  const angle = ((h % 360) * Math.PI) / 180;
  const meters = precision === 'exact' ? 0 : 140 + (h % 280);
  if (meters === 0) return { lat, lng };
  const dLat = (meters * Math.cos(angle)) / 111_320;
  const dLng = (meters * Math.sin(angle)) / (111_320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}
