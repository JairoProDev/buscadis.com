import { Categoria } from '@/types';
import { BrowseFilterState, DEFAULT_BROWSE_FILTERS, PublicadoEn } from './types';

const CATEGORIAS: Categoria[] = [
  'empleos', 'inmuebles', 'vehiculos', 'servicios', 'productos', 'eventos', 'negocios', 'comunidad',
];

function parseNum(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function browseFiltersFromSearchParams(params: URLSearchParams): BrowseFilterState {
  const state: BrowseFilterState = {
    ...DEFAULT_BROWSE_FILTERS,
    facets: {},
  };

  state.precioMin = parseNum(params.get('precio_min'));
  state.precioMax = parseNum(params.get('precio_max'));
  const conPrecio = params.get('con_precio');
  if (conPrecio === '1') state.soloConPrecio = true;
  else if (conPrecio === '0') state.soloConPrecio = false;
  const fotos = params.get('fotos');
  if (fotos === '1') state.conFotos = true;
  else if (fotos === '0') state.conFotos = false;
  if (params.get('verificado') === '1') state.verificado = true;
  if (params.get('destacado') === '1') state.destacado = true;

  const pub = params.get('publicado');
  if (pub === '24h' || pub === '7d' || pub === '30d') {
    state.publicadoEn = pub as PublicadoEn;
  }

  const depto = params.get('depto');
  const prov = params.get('prov');
  const dist = params.get('dist');
  const radio = parseNum(params.get('radio'));
  if (depto || prov || dist) {
    state.ubicacion = {
      departamento: depto || undefined,
      provincia: prov || undefined,
      distrito: dist || undefined,
      radioKm: radio,
    };
  }

  const facetParam = params.get('facet');
  if (facetParam) {
    facetParam.split(',').forEach((pair) => {
      const [key, val] = pair.split(':');
      if (!key || !val) return;
      if (val === '1') {
        state.facets[key] = true;
      } else if (val.includes('|')) {
        state.facets[key] = val.split('|');
      } else {
        state.facets[key] = val;
      }
    });
  }

  return state;
}

export function browseFiltersToSearchParams(
  filters: BrowseFilterState,
  base: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(base.toString());

  const del = [
    'precio_min', 'precio_max', 'con_precio', 'fotos', 'publicado',
    'verificado', 'destacado', 'depto', 'prov', 'dist', 'radio', 'facet',
  ];
  del.forEach((k) => params.delete(k));

  if (filters.precioMin) params.set('precio_min', String(filters.precioMin));
  if (filters.precioMax) params.set('precio_max', String(filters.precioMax));
  if (filters.soloConPrecio !== undefined) params.set('con_precio', filters.soloConPrecio ? '1' : '0');
  if (filters.conFotos !== undefined) params.set('fotos', filters.conFotos ? '1' : '0');
  if (filters.publicadoEn) params.set('publicado', filters.publicadoEn);
  if (filters.verificado) params.set('verificado', '1');
  if (filters.destacado) params.set('destacado', '1');

  if (filters.ubicacion) {
    if (filters.ubicacion.departamento) params.set('depto', filters.ubicacion.departamento);
    if (filters.ubicacion.provincia) params.set('prov', filters.ubicacion.provincia);
    if (filters.ubicacion.distrito) params.set('dist', filters.ubicacion.distrito);
    if (filters.ubicacion.radioKm) params.set('radio', String(filters.ubicacion.radioKm));
  }

  const facetPairs: string[] = [];
  for (const [key, val] of Object.entries(filters.facets)) {
    if (val === false || val === '' || (Array.isArray(val) && val.length === 0)) continue;
    if (typeof val === 'boolean') facetPairs.push(`${key}:1`);
    else if (Array.isArray(val)) facetPairs.push(`${key}:${val.join('|')}`);
    else facetPairs.push(`${key}:${val}`);
  }
  if (facetPairs.length) params.set('facet', facetPairs.join(','));

  return params;
}

export function parseCategoriaFromParams(params: URLSearchParams): Categoria | 'todos' {
  const c = params.get('categoria');
  if (c && CATEGORIAS.includes(c as Categoria)) return c as Categoria;
  return 'todos';
}
