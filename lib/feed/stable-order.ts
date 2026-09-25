import { Adiso } from '@/types';
import { compareRecientesFeed, getFeedRecencyAnchorMs } from '@/lib/feed/ranking';

/**
 * Mantiene el orden visible al paginar: los IDs ya mostrados no se reordenan;
 * los adisos nuevos se añaden al final solo si son más antiguos que el último visible.
 */
export function mergeStableFeedOrder(
  previousOrder: string[],
  freshlySorted: Adiso[],
): string[] {
  const byId = new Map(freshlySorted.map((a) => [a.id, a]));
  const kept = previousOrder.filter((id) => byId.has(id));
  const keptSet = new Set(kept);
  const newcomers = freshlySorted.filter((a) => !keptSet.has(a.id));

  if (newcomers.length === 0) return kept;

  const lastKeptId = kept[kept.length - 1];
  const lastKept = lastKeptId ? byId.get(lastKeptId) : undefined;
  const lastAnchor = lastKept ? getFeedRecencyAnchorMs(lastKept) : Number.POSITIVE_INFINITY;

  const allOlderOrEqual = newcomers.every(
    (a) => getFeedRecencyAnchorMs(a) <= lastAnchor,
  );

  if (!allOlderOrEqual) {
    return freshlySorted.map((a) => a.id);
  }

  newcomers.sort((a, b) => compareRecientesFeed(a, b));
  return [...kept, ...newcomers.map((a) => a.id)];
}

export function resetStableFeedOrderRefs(refs: {
  feedOrderRef: { current: string[] };
  feedLayoutKeyRef: { current: string };
  prevAdisosCountRef: { current: number };
}): void {
  refs.feedOrderRef.current = [];
  refs.feedLayoutKeyRef.current = '';
  refs.prevAdisosCountRef.current = 0;
}
