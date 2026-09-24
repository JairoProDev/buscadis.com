import type { Categoria } from '@/types';
import { getCategoriaLabel } from '@/lib/adiso-display';
import { getCountryByCode, DEFAULT_COUNTRY_CODE } from '@/lib/geo/countries-data';
import type { BrowseFilterState } from '@/lib/filters/types';
import { countActiveFilters } from '@/lib/filters/types';

export function formatBrowseResultsCount(count: number, hasMore: boolean): string {
  const n = Math.max(0, count);
  if (n === 0) return 'Sin resultados';

  const locale = n.toLocaleString('es-PE');

  if (hasMore) {
    if (n >= 1_000_000) {
      const millions = Math.floor(n / 100_000) / 10;
      const label = millions >= 2 ? `${millions} millones` : `${millions} millón`;
      return `Más de ${label} de resultados`;
    }
    if (n >= 10_000) {
      const rounded = Math.floor(n / 1000) * 1000;
      return `Más de ${rounded.toLocaleString('es-PE')} resultados`;
    }
    if (n >= 1000) {
      return `Más de ${locale} resultados`;
    }
    return `Más de ${locale} resultados`;
  }

  if (n >= 1_000_000) {
    return `Unos ${locale} resultados`;
  }

  return `${locale} resultado${n === 1 ? '' : 's'}`;
}

function locationPhrase(ubicacion?: BrowseFilterState['ubicacion']): string | null {
  if (!ubicacion) return null;
  const place =
    ubicacion.distrito ||
    ubicacion.provincia ||
    ubicacion.departamento ||
    (ubicacion.countryCode && ubicacion.countryCode !== DEFAULT_COUNTRY_CODE
      ? getCountryByCode(ubicacion.countryCode)?.name
      : null);
  if (place) return `en ${place}`;
  if (ubicacion.countryCode === DEFAULT_COUNTRY_CODE || ubicacion.country) {
    return `en ${ubicacion.country || 'Perú'}`;
  }
  return null;
}

export function buildBrowseResultsContextParts(input: {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  committedQuery: string;
  ordenamiento?: string;
}): string[] {
  const parts: string[] = [];
  const { categoria, filters, committedQuery, ordenamiento } = input;
  const q = committedQuery.trim();

  if (q) parts.push(`«${q}»`);
  if (categoria !== 'todos') parts.push(getCategoriaLabel(categoria));

  const loc = locationPhrase(filters.ubicacion);
  if (loc) parts.push(loc);
  else if (!q && categoria === 'todos') parts.push('en Cusco');

  const radio = filters.ubicacion?.radioKm;
  if (radio && radio > 0 && radio !== 5) {
    parts.push(`a ${radio} km`);
  } else if (ordenamiento === 'cercanos') {
    parts.push('cerca de ti');
  }

  if (filters.destacado) parts.push('destacados');
  if (filters.verificado) parts.push('verificados');
  if (filters.conFotos === true) parts.push('con fotos');
  if (filters.publicadoEn === '24h') parts.push('últimas 24 h');
  else if (filters.publicadoEn === '7d') parts.push('últimos 7 días');
  else if (filters.publicadoEn === '30d') parts.push('último mes');

  const facetKeys = Object.keys(filters.facets).filter((k) => {
    const v = filters.facets[k];
    return v === true || (typeof v === 'string' && v) || (Array.isArray(v) && v.length > 0);
  });
  if (facetKeys.length > 0 && countActiveFilters(filters, categoria) > facetKeys.length) {
    parts.push('filtros aplicados');
  }

  return parts;
}

export function buildBrowseResultsLine(input: {
  resultCount: number;
  hasMore: boolean;
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  committedQuery: string;
  ordenamiento?: string;
}): string {
  const countPart = formatBrowseResultsCount(input.resultCount, input.hasMore);
  const context = buildBrowseResultsContextParts(input);
  if (context.length === 0) return countPart;
  return `${countPart} · ${context.join(' · ')}`;
}
