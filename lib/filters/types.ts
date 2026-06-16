import { Categoria } from '@/types';

export type PublicadoEn = '24h' | '7d' | '30d';

export type FilterLayoutMode = 'inline' | 'panel';

/** Estado unificado de filtros de exploración */
export interface BrowseFilterState {
  precioMin?: number;
  precioMax?: number;
  /** true = solo con precio publicado, false = solo sin precio, undefined = indiferente */
  soloConPrecio?: boolean;
  /** true = solo con fotos, false = solo sin fotos, undefined = indiferente */
  conFotos?: boolean;
  publicadoEn?: PublicadoEn;
  verificado?: boolean;
  destacado?: boolean;
  ubicacion?: {
    countryCode?: string;
    country?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    radioKm?: number;
    latitud?: number;
    longitud?: number;
  };
  /** Facetas por categoría: clave = filter id, valor = opción(es) */
  facets: Record<string, string | string[] | boolean>;
}

export type FilterControlType =
  | 'toggle'
  | 'tri-toggle'
  | 'chips'
  | 'select'
  | 'price-range'
  | 'ubicacion';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  type: FilterControlType;
  /** Categorías donde aplica; vacío = universal en contexto de categoría */
  categories?: Categoria[];
  options?: FilterOption[];
  group?: string;
  /** Solo mostrar cuando hay categoría seleccionada */
  requiresCategory?: boolean;
}

export interface FilterChip {
  id: string;
  label: string;
  /** clave en BrowseFilterState o facet id */
  field: 'facet' | 'precioMin' | 'precioMax' | 'soloConPrecio' | 'conFotos' | 'publicadoEn' | 'verificado' | 'destacado' | 'ubicacion';
  facetId?: string;
  value?: string;
}

export const DEFAULT_BROWSE_FILTERS: BrowseFilterState = {
  facets: {},
};

export function countActiveFilters(
  state: BrowseFilterState,
  categoria: Categoria | 'todos',
): number {
  let n = 0;
  if (state.precioMin != null && state.precioMin > 0) n++;
  if (state.precioMax != null && state.precioMax > 0) n++;
  if (state.soloConPrecio !== undefined) n++;
  if (state.conFotos !== undefined) n++;
  if (state.publicadoEn) n++;
  if (state.verificado) n++;
  if (state.destacado) n++;
  if (state.ubicacion?.distrito || state.ubicacion?.departamento || state.ubicacion?.provincia || state.ubicacion?.countryCode) n++;
  if (state.ubicacion?.radioKm && state.ubicacion.radioKm !== 5) n++;

  const defs = Object.keys(state.facets);
  for (const key of defs) {
    const v = state.facets[key];
    if (v === true) n++;
    else if (typeof v === 'string' && v) n++;
    else if (Array.isArray(v) && v.length > 0) n += v.length;
  }
  return n;
}
