import { Adiso, UbicacionDetallada } from '@/types';
import { TipoOrdenamiento } from '@/components/Ordenamiento';
import { BrowseFilterState } from './types';
import { adisoMatchesFacets, adisoPublicadoDentroDe, adisoTieneImagen } from './matchers';
import { personalizeAdisos } from '@/lib/ai/personalization';
import { compareRecientesFeed, injectFeedExploration } from '@/lib/feed/ranking';
import type { UserInterestProfile } from '@/lib/interactions';
import { getCountryByCode, DEFAULT_COUNTRY_CODE } from '@/lib/geo/countries-data';

const TEST_REGEX = /toyota test|test adiso|test anuncio/i;

function parsearFecha(fechaPublicacion: string, horaPublicacion: string): number {
  if (!fechaPublicacion) return 0;
  try {
    const raw = String(fechaPublicacion).trim();
    if (raw.includes('T') || raw.endsWith('Z')) {
      const iso = new Date(raw);
      if (!Number.isNaN(iso.getTime())) return iso.getTime();
    }

    let hora = (horaPublicacion || '00:00').trim();
    if (hora.length === 4) hora = `${hora.substring(0, 2)}:${hora.substring(2)}`;
    else if (hora.length >= 8) hora = hora.slice(0, 5);
    else if (hora.length !== 5) hora = '00:00';

    const date = new Date(`${raw}T${hora}:00`);
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

function adisoMatchesCountry(ubi: UbicacionDetallada, countryCode?: string): boolean {
  if (!countryCode || countryCode === DEFAULT_COUNTRY_CODE) {
    const pais = (ubi.pais || 'Perú').toLowerCase();
    return pais.includes('peru') || pais.includes('perú') || !ubi.pais;
  }
  const country = getCountryByCode(countryCode);
  if (!country) return true;
  const pais = (ubi.pais || '').toLowerCase();
  return (
    pais === country.name.toLowerCase() ||
    pais === country.nameEn.toLowerCase() ||
    countryCode.toLowerCase() === pais
  );
}

function matchUbicacion(
  adiso: Adiso,
  filtro: NonNullable<BrowseFilterState['ubicacion']>,
  userLat?: number,
  userLng?: number,
): boolean {
  if (!adiso.ubicacion) {
    // Sin ubicación explícita: no excluir (avisos importados / catálogo nacional)
    return !filtro.distrito && !filtro.provincia;
  }

  let ubi: UbicacionDetallada;
  if (typeof adiso.ubicacion === 'string') {
    const parts = adiso.ubicacion.split(',').map((p) => p.trim()).filter(Boolean);
    // "Cusco, Cusco, Cusco" → distrito, provincia, departamento (o al revés)
    if (parts.length >= 3) {
      ubi = { pais: 'Perú', distrito: parts[0], provincia: parts[1], departamento: parts[2] };
    } else if (parts.length === 2) {
      ubi = { pais: 'Perú', distrito: '', provincia: parts[0], departamento: parts[1] };
    } else {
      ubi = { pais: 'Perú', departamento: parts[0] || adiso.ubicacion, provincia: '', distrito: '' };
    }
  } else {
    ubi = adiso.ubicacion;
  }

  if (filtro.countryCode && !adisoMatchesCountry(ubi, filtro.countryCode)) {
    return false;
  }

  if (!filtro.departamento && !filtro.provincia && !filtro.distrito) {
    return true;
  }

  const haystack = [ubi.distrito, ubi.provincia, ubi.departamento, ubi.direccion]
    .filter(Boolean)
    .map((s) => s!.toLowerCase().trim())
    .join(' | ');

  // Distrito: match exacto o contenido en haystack (evita perder avisos "Cusco, Cusco, Cusco")
  if (filtro.distrito) {
    const d = filtro.distrito.toLowerCase().trim();
    if (ubi.distrito?.toLowerCase().trim() === d) return true;
    if (haystack.includes(d)) return true;
    if (filtro.radioKm && ubi.latitud && ubi.longitud && userLat != null && userLng != null) {
      return calcularDistanciaKm(userLat, userLng, ubi.latitud, ubi.longitud) <= (filtro.radioKm || 5);
    }
    // Si también hay depto/provincia y coinciden, aceptar
    if (filtro.departamento && ubi.departamento?.toLowerCase().trim() === filtro.departamento.toLowerCase().trim()) {
      return true;
    }
    return false;
  }
  if (filtro.provincia) {
    const p = filtro.provincia.toLowerCase().trim();
    if (ubi.provincia?.toLowerCase().trim() === p || haystack.includes(p)) return true;
    if (filtro.departamento && ubi.departamento?.toLowerCase().trim() === filtro.departamento.toLowerCase().trim()) {
      return true;
    }
    return false;
  }
  if (filtro.departamento) {
    const dep = filtro.departamento.toLowerCase().trim();
    if (ubi.departamento?.toLowerCase().trim() === dep || haystack.includes(dep)) return true;
    return false;
  }
  return true;
}

export interface ApplyBrowseFiltersInput {
  adisos: Adiso[];
  categoria: import('@/types').Categoria | 'todos';
  busqueda: string;
  filters: BrowseFilterState;
  ordenamiento: TipoOrdenamiento;
  /** Keep input order (API search ranking) — skips feed re-sort / exploration */
  preserveOrder?: boolean;
  userLat?: number;
  userLng?: number;
  interestProfile?: UserInterestProfile | null;
  hiddenAdIds?: Set<string>;
}

export function applyBrowseFilters({
  adisos,
  categoria,
  busqueda,
  filters,
  ordenamiento,
  preserveOrder = false,
  userLat,
  userLng,
  interestProfile,
  hiddenAdIds,
}: ApplyBrowseFiltersInput): Adiso[] {
  let filtrados = adisos.filter((a) => !TEST_REGEX.test(a.titulo || ''));

  if (hiddenAdIds && hiddenAdIds.size > 0) {
    filtrados = filtrados.filter((a) => !hiddenAdIds.has(a.id));
  }

  // No excluir categorías enteras por señales negativas: eso dejaba el feed en 3–4 avisos.
  // La personalización solo reordena (personalizeAdisos / compareRecientesFeed).

  if (categoria !== 'todos') {
    filtrados = filtrados.filter((a) => a.categoria === categoria);
  }

  if (filters.conFotos === true) {
    filtrados = filtrados.filter(adisoTieneImagen);
  } else if (filters.conFotos === false) {
    filtrados = filtrados.filter((a) => !adisoTieneImagen(a));
  }

  if (filters.soloConPrecio === true) {
    filtrados = filtrados.filter((a) => a.precio != null && a.precio > 0);
  } else if (filters.soloConPrecio === false) {
    filtrados = filtrados.filter((a) => a.precio == null || a.precio <= 0);
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

  // Preserve API relevance order (search results already ranked)
  if (preserveOrder) {
    return filtrados;
  }

  const sorted = [...filtrados].sort((a, b) => {
    switch (ordenamiento) {
    case 'recientes':
      return compareRecientesFeed(a, b, interestProfile);
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

  if (ordenamiento === 'recientes' && interestProfile) {
    return injectFeedExploration(personalizeAdisos(sorted, interestProfile));
  }
  if (ordenamiento === 'recientes') {
    return injectFeedExploration(sorted);
  }
  return sorted;
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
