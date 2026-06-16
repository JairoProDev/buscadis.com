import { BrowseFilterState } from './types';
import { getFiltersForCategory } from './definitions';

export interface ActiveFilterChip {
  id: string;
  label: string;
}

const PUB_LABELS: Record<string, string> = {
  '24h': 'Últimas 24 h',
  '7d': 'Última semana',
  '30d': 'Último mes',
};

export function getActiveFilterChips(
  filters: BrowseFilterState,
  categoria: import('@/types').Categoria | 'todos',
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  const u = filters.ubicacion;
  const ubiLabel = u?.distrito || u?.provincia || u?.departamento;
  if (ubiLabel) {
    const radio = u?.radioKm && u.radioKm !== 5 ? ` · ${u.radioKm} km` : '';
    chips.push({ id: 'ubicacion', label: `${ubiLabel}${radio}` });
  }

  if (filters.precioMin && filters.precioMax) {
    chips.push({ id: 'precio', label: `S/ ${filters.precioMin} – ${filters.precioMax}` });
  } else if (filters.precioMax) {
    chips.push({ id: 'precio', label: `Hasta S/ ${filters.precioMax.toLocaleString('es-PE')}` });
  } else if (filters.precioMin) {
    chips.push({ id: 'precio', label: `Desde S/ ${filters.precioMin.toLocaleString('es-PE')}` });
  }

  if (filters.soloConPrecio === true) chips.push({ id: 'soloConPrecio', label: 'Con precio' });
  if (filters.soloConPrecio === false) chips.push({ id: 'soloConPrecio', label: 'Sin precio' });
  if (filters.conFotos === true) chips.push({ id: 'conFotos', label: 'Con fotos' });
  if (filters.conFotos === false) chips.push({ id: 'conFotos', label: 'Sin fotos' });
  if (filters.publicadoEn) chips.push({ id: 'publicadoEn', label: PUB_LABELS[filters.publicadoEn] ?? filters.publicadoEn });
  if (filters.verificado) chips.push({ id: 'verificado', label: 'Verificado' });
  if (filters.destacado) chips.push({ id: 'destacado', label: 'Destacados' });

  const defs = getFiltersForCategory(categoria);
  for (const [facetId, raw] of Object.entries(filters.facets)) {
    const def = defs.find((d) => d.id === facetId);
    if (raw === true) {
      chips.push({ id: facetId, label: def?.label ?? facetId });
      continue;
    }
    const val = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;
    if (!val) continue;
    const opt = def?.options?.find((o) => o.value === val);
    chips.push({ id: facetId, label: opt?.label ?? String(val) });
  }

  return chips;
}

export function clearFilterChip(
  filters: BrowseFilterState,
  chipId: string,
): BrowseFilterState {
  const next = { ...filters, facets: { ...filters.facets } };

  if (chipId === 'ubicacion') {
    delete next.ubicacion;
    return next;
  }
  if (chipId === 'precio') {
    delete next.precioMin;
    delete next.precioMax;
    return next;
  }
  if (chipId === 'soloConPrecio') {
    delete next.soloConPrecio;
    return next;
  }
  if (chipId === 'conFotos') {
    delete next.conFotos;
    return next;
  }
  if (chipId === 'publicadoEn') {
    delete next.publicadoEn;
    return next;
  }
  if (chipId === 'verificado') {
    delete next.verificado;
    return next;
  }
  if (chipId === 'destacado') {
    delete next.destacado;
    return next;
  }
  delete next.facets[chipId];
  return next;
}
