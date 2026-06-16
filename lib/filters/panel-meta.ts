import { Categoria } from '@/types';
import { BrowseFilterState, countActiveFilters } from './types';

export interface FilterSectionMeta {
  id: string;
  step: number;
  title: string;
  completed: boolean;
  active: boolean;
}

export function buildFilterInsight(
  filters: BrowseFilterState,
  categoria: Categoria | 'todos',
  resultCount: number,
  totalPool: number,
): string {
  const active = countActiveFilters(filters, categoria);
  if (active === 0) {
    return totalPool > 0
      ? `Explorando ${totalPool} avisos. Añade filtros para afinar.`
      : 'No hay avisos en esta vista.';
  }
  if (resultCount === 0) {
    return 'Ningún aviso coincide. Prueba relajar un filtro.';
  }
  const pct = totalPool > 0 ? Math.round((resultCount / totalPool) * 100) : 100;
  if (pct <= 15) {
    return `Selección muy específica: ${resultCount} de ${totalPool} avisos (${pct}%).`;
  }
  if (filters.destacado && filters.conFotos === true) {
    return `${resultCount} opciones curadas con foto y calidad.`;
  }
  return `${resultCount} avisos coinciden con tus ${active} filtro${active === 1 ? '' : 's'}.`;
}

export function getSectionCompletion(
  filters: BrowseFilterState,
  categoria: Categoria | 'todos',
): FilterSectionMeta[] {
  const u = filters.ubicacion;
  const hasUbi = Boolean(u?.distrito || u?.provincia || u?.departamento);
  const hasCatFacets =
    categoria !== 'todos' &&
    Object.keys(filters.facets).some((k) => filters.facets[k] !== undefined && filters.facets[k] !== false);
  const hasPrecio =
    (filters.precioMin != null && filters.precioMin > 0) ||
    (filters.precioMax != null && filters.precioMax > 0) ||
    filters.soloConPrecio !== undefined;
  const hasCalidad = filters.conFotos !== undefined;
  const hasConfianza = Boolean(filters.verificado || filters.destacado);
  const hasFecha = Boolean(filters.publicadoEn);

  const sections: Omit<FilterSectionMeta, 'step'>[] = [
    { id: 'ubicacion', title: 'Dónde', completed: hasUbi, active: hasUbi },
  ];

  if (categoria !== 'todos') {
    sections.push({ id: 'tipo', title: 'Tipo', completed: hasCatFacets, active: hasCatFacets });
  }

  sections.push(
    { id: 'presupuesto', title: 'Presupuesto', completed: hasPrecio, active: hasPrecio },
    { id: 'calidad', title: 'Calidad', completed: hasCalidad, active: hasCalidad },
    { id: 'confianza', title: 'Confianza', completed: hasConfianza, active: hasConfianza },
    { id: 'fecha', title: 'Fecha', completed: hasFecha, active: hasFecha },
  );

  return sections.map((s, i) => ({ ...s, step: i + 1 }));
}
