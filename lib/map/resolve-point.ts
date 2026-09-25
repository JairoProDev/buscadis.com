import { DISTRITOS_CUSCO, type DistritoCusco } from '@/lib/cusco-ubicaciones';

export interface ResolvedPoint {
  lat: number;
  lng: number;
  /** exact = el anunciante marcó un punto; area = centro de distrito o texto. */
  source: 'exact' | 'area';
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
}

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Elige el distrito más específico mencionado (evita que "Cusco" gane sobre "San Sebastián"). */
export function distritoMasEspecifico(texto: string | null | undefined): DistritoCusco | null {
  if (!texto?.trim()) return null;
  const hay = norm(texto);
  let best: { distrito: DistritoCusco; len: number } | null = null;

  for (const distrito of DISTRITOS_CUSCO) {
    const nombres = [distrito.nombre, ...distrito.variantes];
    for (const nombre of nombres) {
      const n = norm(nombre);
      if (n.length < 4) continue;
      if (!hay.includes(n)) continue;
      if (!best || n.length > best.len) best = { distrito, len: n.length };
    }
  }
  return best?.distrito ?? null;
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** "Cusco, Perú" no es un punto. "San Sebastián" o "Av. El Sol, Cusco" sí. */
export function textoUbicaEnZona(texto: string | null | undefined, distrito: DistritoCusco): boolean {
  if (!texto?.trim()) return false;
  if (distrito.nombre !== 'Cusco') return true;
  const resto = norm(texto).replace(/cusco|cuzco|peru/g, ' ').replace(/[^a-z0-9\s]/g, ' ').trim();
  return resto.length > 3;
}

export function coordenadasValidas(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) > 0.5 &&
    Math.abs(lng) > 0.5 &&
    lat >= -56 &&
    lat <= 14 &&
    lng >= -82 &&
    lng <= -66
  );
}

/**
 * Punto que se guarda en la base. Si hay lat/lng reales, se conservan.
 * Si solo hay distrito o texto de Cusco, se usa el centro del distrito para que el anuncio entre al mapa.
 */
export function resolveStoredPoint(input: {
  latitud?: number | null;
  longitud?: number | null;
  distrito?: string | null;
  text?: string | null;
}): ResolvedPoint | null {
  if (coordenadasValidas(input.latitud, input.longitud)) {
    const named = distritoMasEspecifico(input.distrito) || distritoMasEspecifico(input.text);
    const nearCenter =
      named != null && distanceMeters(input.latitud, input.longitud as number, named.coordenadas.lat, named.coordenadas.lng) < 80;
    return {
      lat: input.latitud,
      lng: input.longitud as number,
      source: nearCenter ? 'area' : 'exact',
      distrito: named?.nombre ?? input.distrito ?? null,
      provincia: named?.provincia ?? null,
      departamento: named ? 'Cusco' : null,
    };
  }

  const named =
    distritoMasEspecifico(input.distrito) ||
    distritoMasEspecifico(input.text);
  if (!named) return null;

  return {
    lat: named.coordenadas.lat,
    lng: named.coordenadas.lng,
    source: 'area',
    distrito: named.nombre,
    provincia: named.provincia,
    departamento: 'Cusco',
  };
}
