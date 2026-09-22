import { Adiso, UbicacionDetallada } from '@/types';
import { getPublishedTimestamp } from '@/lib/feed/ranking';
import { adisoTieneImagen } from '@/lib/adiso-display';
import { buscarDistritoEnTexto, obtenerCoordenadasDistrito } from '@/lib/cusco-ubicaciones';
import { getCoordenadasAproximadas } from '@/lib/peru-ubicaciones';

/** Solo para comparar soles y dólares en el orden. No es un tipo de cambio de cobro. */
const USD_A_PEN = 3.75;

/** Una consulta pesa más que una vista: alguien escribió o llamó. */
const PESO_CONTACTO = 5;

/** A los 21 días, el interés visible vale la mitad. El archivo no tapa lo de esta semana. */
const VIDA_MEDIA_DIAS = 21;

export function precioEnSoles(adiso: Adiso): number | null {
  if (adiso.tipoPrecio === 'a_convenir') return null;
  if (adiso.tipoPrecio === 'gratis') return 0;
  if (adiso.precio == null || !Number.isFinite(adiso.precio) || adiso.precio <= 0) return null;
  return adiso.moneda === 'USD' ? adiso.precio * USD_A_PEN : adiso.precio;
}

function compararRecencia(a: Adiso, b: Adiso): number {
  const delta = getPublishedTimestamp(b) - getPublishedTimestamp(a);
  return delta !== 0 ? delta : a.id.localeCompare(b.id);
}

/** Menor o mayor precio. Sin precio o "a convenir" quedan al final, y entre iguales gana lo más nuevo. */
export function comparePrecio(a: Adiso, b: Adiso, direccion: 'asc' | 'desc'): number {
  const pa = precioEnSoles(a);
  const pb = precioEnSoles(b);
  if (pa == null && pb == null) return compararRecencia(a, b);
  if (pa == null) return 1;
  if (pb == null) return -1;
  const delta = direccion === 'asc' ? pa - pb : pb - pa;
  return delta !== 0 ? delta : compararRecencia(a, b);
}

export function resolveAdisoCoords(adiso: Adiso): { lat: number; lng: number } | null {
  const ubi = adiso.ubicacion;
  if (ubi && typeof ubi === 'object') {
    const det = ubi as UbicacionDetallada;
    if (
      typeof det.latitud === 'number' &&
      typeof det.longitud === 'number' &&
      Number.isFinite(det.latitud) &&
      Number.isFinite(det.longitud) &&
      !(det.latitud === 0 && det.longitud === 0)
    ) {
      return { lat: det.latitud, lng: det.longitud };
    }
    if (det.distrito) {
      const porNombre = obtenerCoordenadasDistrito(det.distrito);
      if (porNombre) return porNombre;
    }
    if (det.departamento && det.provincia && det.distrito) {
      const aprox = getCoordenadasAproximadas(det.departamento, det.provincia, det.distrito);
      if (aprox) return aprox;
    }
    const texto = [det.distrito, det.provincia, det.departamento, det.direccion].filter(Boolean).join(', ');
    const distrito = buscarDistritoEnTexto(texto);
    return distrito ? distrito.coordenadas : null;
  }

  if (typeof ubi === 'string' && ubi.trim()) {
    const distrito = buscarDistritoEnTexto(ubi);
    return distrito ? distrito.coordenadas : null;
  }

  return null;
}

function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Primero lo que está cerca. Sin coordenadas del aviso, al final.
 * Sin ubicación del usuario, cae a recencia: no inventamos cercanía.
 */
export function compareCercanos(
  a: Adiso,
  b: Adiso,
  userLat?: number,
  userLng?: number,
): number {
  if (userLat == null || userLng == null || !Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return compararRecencia(a, b);
  }
  const ca = resolveAdisoCoords(a);
  const cb = resolveAdisoCoords(b);
  if (!ca && !cb) return compararRecencia(a, b);
  if (!ca) return 1;
  if (!cb) return -1;
  const delta = distanciaKm(userLat, userLng, ca.lat, ca.lng) - distanciaKm(userLat, userLng, cb.lat, cb.lng);
  return delta !== 0 ? delta : compararRecencia(a, b);
}

/**
 * Vistas y consultas, con decaimiento. Un aviso de hoy con poca atención
 * le gana a uno del archivo que acumuló visitas hace años.
 */
export function scoreInteres(adiso: Adiso, now = Date.now()): number {
  const vistas = Math.max(0, adiso.vistas || 0);
  const contactos = Math.max(0, adiso.contactos || 0);
  const bruto = vistas + contactos * PESO_CONTACTO;
  if (bruto === 0) return 0;
  const publicado = getPublishedTimestamp(adiso);
  const edadDias = publicado > 0 ? Math.max(0, (now - publicado) / 86_400_000) : 3650;
  return bruto * Math.pow(0.5, edadDias / VIDA_MEDIA_DIAS);
}

export function compareVistos(a: Adiso, b: Adiso, now = Date.now()): number {
  const delta = scoreInteres(b, now) - scoreInteres(a, now);
  return delta !== 0 ? delta : compararRecencia(a, b);
}

function cantidadImagenes(adiso: Adiso): number {
  const urls = adiso.imagenesUrls?.filter((u) => u?.trim()).length ?? 0;
  if (urls > 0) return urls;
  return adiso.imagenUrl?.trim() ? 1 : 0;
}

/** Primero los que se pueden mirar, y entre esos lo más nuevo. */
export function compareConFotos(a: Adiso, b: Adiso): number {
  const ha = adisoTieneImagen(a) || cantidadImagenes(a) > 0 ? 1 : 0;
  const hb = adisoTieneImagen(b) || cantidadImagenes(b) > 0 ? 1 : 0;
  if (ha !== hb) return hb - ha;
  const recencia = compararRecencia(a, b);
  if (recencia !== 0) return recencia;
  return cantidadImagenes(b) - cantidadImagenes(a);
}
