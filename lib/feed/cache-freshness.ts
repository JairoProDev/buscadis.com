import type { Adiso } from '@/types';
import { getPublishedTimestamp } from '@/lib/feed/ranking';

/** Si el cache local es más viejo que esto, no mostrarlo al abrir el home (evita flash 2024 en prod). */
const MAX_CACHE_AGE_MS = 21 * 24 * 60 * 60 * 1000;

export function feedLocalCacheLooksStale(adisos: Adiso[]): boolean {
  if (!adisos.length) return false;
  let newest = 0;
  for (const a of adisos) {
    newest = Math.max(newest, getPublishedTimestamp(a));
  }
  if (newest <= 0) return true;
  return Date.now() - newest > MAX_CACHE_AGE_MS;
}
