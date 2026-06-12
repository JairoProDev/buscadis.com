import { Adiso, UbicacionDetallada } from '@/types';
import { TipoOrdenamiento } from '@/components/Ordenamiento';
import { BrowseFilterState } from './types';
import { adisoMatchesFacets, adisoPublicadoDentroDe, adisoTieneImagen } from './matchers';

const TEST_REGEX = /toyota test|test adiso|test anuncio/i;

function parsearFecha(fechaPublicacion: string, horaPublicacion: string): number {
  if (!fechaPublicacion) return 0;
  try {
    let hora = horaPublicacion || '00:00';
    if (hora.length === 4) hora = `${hora.substring(0, 2)}:${hora.substring(2)}`;
    else if (hora.length !== 5) hora = '00:00';
    const date = new Date(`${fechaPublicacion}T${hora}:00`);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
}

function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function matchUbicacion(
  adiso: Adiso,
  filtro: NonNullable<BrowseFilterState['ubicacion']>,
  userLat?: number,
  userLng?: number,
): boolean {
  if (!adiso.ubicacion) return false;
  const ubi: UbicacionDetallada = typeof adiso.ubicacion === 'string'
    ? { pais: 'Perú', departamento: adiso.ubicacion, provincia: '', distrito: '' }
    : adiso.ubicacion;

  if (filtro.distrito) {
    const matchDistrito = ubi.distrito?.toLowerCase().trim() === filtro.distrito.toLowerCase().trim();
    if (matchDistrito) return true;
    if (filtro.radioKm && ubi.latitud && ubi.longitud && userLat != null && userLng != null) {
      return calcularDistanciaKm(userLat, userLng, ubi.latitud, ubi.longitud) <= (filtro.radioKm || 5);
    }
    return false;
  }
  if (filtro.provincia) {
    const match = ubi.provincia?.toLowerCase().trim() === filtro.provincia.toLowerCase().trim();
    if (match) return true;
    if (!filtro.distrito) return false;
  }
  if (filtro.departamento) {
    const match = ubi.departamento?.toLowerCase().trim() === filtro.departamento.toLowerCase().trim();
    if (match) return true;
    if (!filtro.provincia && !filtro.distrito) return false;
  }
  return true;
}

export interface ApplyBrowseFiltersInput {
  adisos: Adiso[];
  categoria: import('@/types').Categoria | 'todos';
  busqueda: string;
  filters: BrowseFilterState;
  ordenamiento: TipoOrdenamiento;
  userLat?: number;
  userLng?: number;
}

export function applyBrowseFilters({
  adisos,
  categoria,
  busqueda,
  filters,
  ordenamiento,
  userLat,
  userLng,
}: ApplyBrowseFiltersInput): Adiso[] {
  let filtrados = adisos.filter((a) => !TEST_REGEX.test(a.titulo || ''));

  if (categoria !== 'todos') {
    filtrados = filtrados.filter((a) => a.categoria === categoria);
  }

  const hayActivos = filtrados.some((a) => !a.esHistorico);
  if (!filters.incluirMasAnuncios && hayActivos) {
    filtrados = filtrados.filter((a) => !a.esHistorico);
  }

  if (filters.conFotos) {
    filtrados = filtrados.filter(adisoTieneImagen);
  }

  if (filters.soloConPrecio) {
    filtrados = filtrados.filter((a) => a.precio != null && a.precio > 0);
  }

  if (filters.precioMin != null && filters.precioMin > 0) {
    filtrados = filtrados.filter((a) => (a.precio ?? 0) >= filters.precioMin!);
  }
  if (filters.precioMax != null && filters.precioMax > 0) {
    filtrados = filtrados.filter((a) => {
      const p = a.precio ?? 0;
      return p > 0 && p <= filters.precioMax!;
    });
  }

  if (filters.publicadoEn) {
    filtrados = filtrados.filter((a) => adisoPublicadoDentroDe(a, filters.publicadoEn!));
  }

  if (filters.verificado) {
    filtrados = filtrados.filter((a) => a.vendedor?.esVerificado);
  }

  if (filters.destacado) {
    filtrados = filtrados.filter((a) => a.esDestacado);
  }

  if (filters.ubicacion) {
    filtrados = filtrados.filter((a) => matchUbicacion(a, filters.ubicacion!, userLat, userLng));
  }

  if (Object.keys(filters.facets).length > 0) {
    filtrados = filtrados.filter((a) => adisoMatchesFacets(a, filters.facets));
  }

  const q = busqueda.trim().toLowerCase();
  if (q) {
    filtrados = filtrados.filter((a) => {
      const tituloMatch = a.titulo.toLowerCase().includes(q);
      const descripcionMatch = a.descripcion.toLowerCase().includes(q);
      let ubicacionMatch = false;
      if (typeof a.ubicacion === 'string') {
        ubicacionMatch = a.ubicacion.toLowerCase().includes(q);
      } else if (a.ubicacion && typeof a.ubicacion === 'object') {
        const ubi = a.ubicacion;
        ubicacionMatch =
          (ubi.departamento?.toLowerCase().includes(q) ?? false) ||
          (ubi.provincia?.toLowerCase().includes(q) ?? false) ||
          (ubi.distrito?.toLowerCase().includes(q) ?? false) ||
          (ubi.direccion?.toLowerCase().includes(q) ?? false);
      }
      return tituloMatch || descripcionMatch || ubicacionMatch;
    });
  }

  return [...filtrados].sort((a, b) => {
    switch (ordenamiento) {
    case 'recientes': {
      const fa = parsearFecha(a.fechaPublicacion, a.horaPublicacion);
      const fb = parsearFecha(b.fechaPublicacion, b.horaPublicacion);
      const c = fb - fa;
      return c !== 0 ? c : a.id.localeCompare(b.id);
    }
    case 'antiguos': {
      const fa = parsearFecha(a.fechaPublicacion, a.horaPublicacion);
      const fb = parsearFecha(b.fechaPublicacion, b.horaPublicacion);
      const c = fa - fb;
      return c !== 0 ? c : a.id.localeCompare(b.id);
    }
    case 'precio-asc': {
      const pa = a.precio && a.precio > 0 ? a.precio : Number.MAX_SAFE_INTEGER;
      const pb = b.precio && b.precio > 0 ? b.precio : Number.MAX_SAFE_INTEGER;
      return pa - pb || a.id.localeCompare(b.id);
    }
    case 'precio-desc': {
      const pa = a.precio ?? 0;
      const pb = b.precio ?? 0;
      return pb - pa || a.id.localeCompare(b.id);
    }
    case 'titulo-asc':
      return a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' });
    case 'titulo-desc':
      return b.titulo.localeCompare(a.titulo, 'es', { sensitivity: 'base' });
    default:
      return 0;
    }
  });
}

export function countFacetOption(
  adisos: Adiso[],
  categoria: import('@/types').Categoria | 'todos',
  busqueda: string,
  filters: BrowseFilterState,
  facetId: string,
  optionValue: string,
  userLat?: number,
  userLng?: number,
): number {
  const base = { ...filters, facets: { ...filters.facets } };
  delete base.facets[facetId];
  const trial: BrowseFilterState = {
    ...base,
    facets: {
      ...base.facets,
      [facetId]: optionValue,
    },
  };
  return applyBrowseFilters({
    adisos,
    categoria,
    busqueda,
    filters: trial,
    ordenamiento: 'recientes',
    userLat,
    userLng,
  }).length;
}
