import type { MotoRequestStatus } from './types';

/** Transiciones válidas del status machine de envíos */
const ALLOWED: Record<MotoRequestStatus, MotoRequestStatus[]> = {
  pendiente: ['aceptado', 'cancelado'],
  aceptado: ['recogido', 'cancelado'],
  recogido: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};

export function canTransition(
  from: MotoRequestStatus,
  to: MotoRequestStatus
): boolean {
  return (ALLOWED[from] || []).includes(to);
}

export function nextStatusForAction(
  action: 'accept' | 'recogido' | 'entregado' | 'cancel',
  current: MotoRequestStatus
): MotoRequestStatus | null {
  const map = {
    accept: 'aceptado',
    recogido: 'recogido',
    entregado: 'entregado',
    cancel: 'cancelado',
  } as const;
  const next = map[action];
  if (!canTransition(current, next)) return null;
  return next;
}

/** ETA rough: assume ~22 km/h average in Cusco urban */
export function estimateEtaMinutes(
  distanceKm: number,
  avgSpeedKmh = 22
): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 5;
  return Math.max(5, Math.round((distanceKm / avgSpeedKmh) * 60));
}
