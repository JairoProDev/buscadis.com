import { Adiso } from '@/types';

/**
 * Mantiene el orden visible al paginar: los IDs ya mostrados no se reordenan;
 * los anuncios nuevos se añaden al final en el orden que devuelve el servidor.
 */
export function mergeStableFeedOrder(
  previousOrder: string[],
  freshlySorted: Adiso[],
): string[] {
  const byId = new Map(freshlySorted.map((a) => [a.id, a]));
  const kept = previousOrder.filter((id) => byId.has(id));
  const keptSet = new Set(kept);
  const appended = freshlySorted.filter((a) => !keptSet.has(a.id)).map((a) => a.id);
  return [...kept, ...appended];
}
