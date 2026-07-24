/** Tarifas Buscadis Envíos — S/1 por km estimado */

export const FARE_PER_KM = 1;
/** Factor sobre distancia Haversine para aproximar calles reales */
export const ROUTE_FACTOR = 1.3;
export const MIN_FARE = 3;

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateDistanceKm(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number
): number {
  const raw = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
  return Math.round(raw * ROUTE_FACTOR * 100) / 100;
}

export function estimateFare(distanceKm: number): number {
  const fare = Math.max(MIN_FARE, distanceKm * FARE_PER_KM);
  return Math.round(fare * 10) / 10;
}

export function formatFareSoles(amount: number): string {
  return `S/ ${amount.toFixed(amount % 1 === 0 ? 0 : 1)}`;
}
