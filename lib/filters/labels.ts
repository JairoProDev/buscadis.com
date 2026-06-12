import { Categoria } from '@/types';
import { BrowseFilterState, FilterChip } from './types';
import { getFilterDefinition, getFiltersForCategory } from './definitions';

export function buildFilterChips(
  filters: BrowseFilterState,
  categoria: Categoria | 'todos',
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (filters.precioMin) {
    chips.push({ id: 'precioMin', field: 'precioMin', label: `Desde S/ ${filters.precioMin.toLocaleString('es-PE')}` });
  }
  if (filters.precioMax) {
    chips.push({ id: 'precioMax', field: 'precioMax', label: `Hasta S/ ${filters.precioMax.toLocaleString('es-PE')}` });
  }
  if (filters.soloConPrecio) {
    chips.push({ id: 'soloConPrecio', field: 'soloConPrecio', label: 'Con precio' });
  }
  if (filters.conFotos) {
    chips.push({ id: 'conFotos', field: 'conFotos', label: 'Con fotos' });
  }
  if (filters.publicadoEn) {
    const labels = { '24h': 'Últimas 24 h', '7d': 'Última semana', '30d': 'Último mes' };
    chips.push({ id: 'publicadoEn', field: 'publicadoEn', label: labels[filters.publicadoEn] });
  }
  if (filters.verificado) {
    chips.push({ id: 'verificado', field: 'verificado', label: 'Verificado' });
  }
  if (filters.destacado) {
    chips.push({ id: 'destacado', field: 'destacado', label: 'Destacado' });
  }
  if (filters.incluirMasAnuncios) {
    chips.push({ id: 'incluirMasAnuncios', field: 'incluirMasAnuncios', label: 'Más anuncios' });
  }
  if (filters.ubicacion?.distrito) {
    chips.push({ id: 'ubicacion', field: 'ubicacion', label: filters.ubicacion.distrito });
  } else if (filters.ubicacion?.provincia) {
    chips.push({ id: 'ubicacion', field: 'ubicacion', label: filters.ubicacion.provincia });
  } else if (filters.ubicacion?.departamento) {
    chips.push({ id: 'ubicacion', field: 'ubicacion', label: filters.ubicacion.departamento });
  }

  for (const [facetId, raw] of Object.entries(filters.facets)) {
    const def = getFilterDefinition(facetId, categoria);
    if (!def) continue;

    if (typeof raw === 'boolean' && raw) {
      chips.push({ id: facetId, field: 'facet', facetId, label: def.label });
      continue;
    }

    const values = Array.isArray(raw) ? raw : [raw];
    for (const v of values) {
      if (!v || typeof v !== 'string') continue;
      const opt = def.options?.find((o) => o.value === v);
      chips.push({
        id: `${facetId}-${v}`,
        field: 'facet',
        facetId,
        value: v,
        label: opt?.label ?? v,
      });
    }
  }

  return chips;
}

export function removeFilterChip(
  filters: BrowseFilterState,
  chip: FilterChip,
): BrowseFilterState {
  const next: BrowseFilterState = { ...filters, facets: { ...filters.facets } };

  switch (chip.field) {
  case 'precioMin':
    delete next.precioMin;
    break;
  case 'precioMax':
    delete next.precioMax;
    break;
  case 'soloConPrecio':
    delete next.soloConPrecio;
    break;
  case 'conFotos':
    delete next.conFotos;
    break;
  case 'publicadoEn':
    delete next.publicadoEn;
    break;
  case 'verificado':
    delete next.verificado;
    break;
  case 'destacado':
    delete next.destacado;
    break;
  case 'incluirMasAnuncios':
    delete next.incluirMasAnuncios;
    break;
  case 'ubicacion':
    delete next.ubicacion;
    break;
  case 'facet':
    if (!chip.facetId) break;
    const current = next.facets[chip.facetId];
    if (typeof current === 'boolean') {
      delete next.facets[chip.facetId];
    } else if (Array.isArray(current) && chip.value) {
      const filtered = current.filter((v) => v !== chip.value);
      if (filtered.length) next.facets[chip.facetId] = filtered;
      else delete next.facets[chip.facetId];
    } else {
      delete next.facets[chip.facetId];
    }
    break;
  default:
    break;
  }

  return next;
}

export function clearCategoryFacets(
  filters: BrowseFilterState,
  categoria: Categoria | 'todos',
): BrowseFilterState {
  const defs = getFiltersForCategory(categoria);
  const categoryIds = new Set(
    defs.filter((d) => d.requiresCategory).map((d) => d.id),
  );
  const facets = { ...filters.facets };
  categoryIds.forEach((id) => delete facets[id]);
  return { ...filters, facets };
}
