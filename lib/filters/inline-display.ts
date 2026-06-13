import { Categoria } from '@/types';
import { BrowseFilterState } from './types';
import { getFiltersForCategory } from './definitions';

export interface InlineFilterButton {
  id: string;
  label: string;
  activeLabel?: string;
  isActive: boolean;
  type: 'precio' | 'select' | 'chips' | 'ubicacion' | 'panel';
  facetId?: string;
}

const PUB_LABELS: Record<string, string> = {
  '24h': 'Últimas 24 h',
  '7d': 'Última semana',
  '30d': 'Último mes',
};

/** Filtros booleanos rápidos de la categoría actual (toggles simples sí/no) */
export function getQuickToggleDefs(categoria: Categoria | 'todos') {
  if (categoria === 'todos') return [];
  return getFiltersForCategory(categoria).filter((d) => d.requiresCategory && d.type === 'toggle');
}

/** Cuenta cuántos filtros "rápidos" (panel unificado) están activos */
export function countQuickFilters(categoria: Categoria | 'todos', filters: BrowseFilterState): number {
  let n = 0;
  if (filters.conFotos !== undefined) n++;
  if (filters.soloConPrecio !== undefined) n++;
  if (filters.verificado) n++;
  if (filters.destacado) n++;
  for (const def of getQuickToggleDefs(categoria)) {
    if (filters.facets[def.id] === true) n++;
  }
  return n;
}

export function getInlineFilterButtons(
  categoria: Categoria | 'todos',
  filters: BrowseFilterState,
): InlineFilterButton[] {
  const buttons: InlineFilterButton[] = [];

  const hasPrecio = (filters.precioMin != null && filters.precioMin > 0)
    || (filters.precioMax != null && filters.precioMax > 0);
  let precioLabel: string | undefined;
  if (filters.precioMin && filters.precioMax) {
    precioLabel = `S/ ${filters.precioMin} – ${filters.precioMax}`;
  } else if (filters.precioMax) {
    precioLabel = `Hasta S/ ${filters.precioMax.toLocaleString('es-PE')}`;
  } else if (filters.precioMin) {
    precioLabel = `Desde S/ ${filters.precioMin.toLocaleString('es-PE')}`;
  }
  buttons.push({
    id: 'precio',
    label: 'Precio',
    activeLabel: precioLabel,
    isActive: hasPrecio,
    type: 'precio',
  });

  // Filtros de categoría (chips) primero: hacen evidente el cambio de categoría
  if (categoria !== 'todos') {
    const catDefs = getFiltersForCategory(categoria).filter((d) => d.requiresCategory && d.type === 'chips' && d.options);
    for (const def of catDefs) {
      const raw = filters.facets[def.id];
      const val = typeof raw === 'string' ? raw : (Array.isArray(raw) ? raw[0] : undefined);
      const opt = val ? def.options!.find((o) => o.value === val) : undefined;
      buttons.push({
        id: def.id,
        label: def.label,
        activeLabel: opt?.label,
        isActive: Boolean(val),
        type: 'chips',
        facetId: def.id,
      });
    }
  }

  buttons.push({
    id: 'publicadoEn',
    label: 'Fecha',
    activeLabel: filters.publicadoEn ? PUB_LABELS[filters.publicadoEn] : undefined,
    isActive: Boolean(filters.publicadoEn),
    type: 'select',
  });

  const u = filters.ubicacion;
  const ubicLabel = u?.distrito || u?.provincia || u?.departamento;
  buttons.push({
    id: 'ubicacion',
    label: 'Ubicación',
    activeLabel: ubicLabel,
    isActive: Boolean(ubicLabel),
    type: 'ubicacion',
  });

  // Panel unificado: fotos, precio publicado, verificado, destacado y toggles de categoría
  const quickCount = countQuickFilters(categoria, filters);
  buttons.push({
    id: 'panel',
    label: 'Filtros',
    activeLabel: quickCount > 0 ? `Filtros · ${quickCount}` : undefined,
    isActive: quickCount > 0,
    type: 'panel',
  });

  return buttons;
}

export function clearInlineFilter(
  filters: BrowseFilterState,
  buttonId: string,
  facetId?: string,
): BrowseFilterState {
  const next = { ...filters, facets: { ...filters.facets } };

  if (buttonId === 'precio') {
    delete next.precioMin;
    delete next.precioMax;
    return next;
  }
  if (buttonId === 'ubicacion') {
    delete next.ubicacion;
    return next;
  }
  if (buttonId === 'publicadoEn') {
    delete next.publicadoEn;
    return next;
  }
  if (buttonId === 'panel') {
    delete next.conFotos;
    delete next.soloConPrecio;
    delete next.verificado;
    delete next.destacado;
    for (const key of Object.keys(next.facets)) {
      if (next.facets[key] === true) delete next.facets[key];
    }
    return next;
  }
  if (facetId) {
    delete next.facets[facetId];
  }
  return next;
}
