export type ListingVista = 'grid' | 'list' | 'feed';

export type ListingScrollSnapshot = {
  y: number;
  visibleCount: number;
  vista: ListingVista;
  savedAt: number;
};

const KEY = 'buscadis:home-list';
const MAX_AGE_MS = 30 * 60 * 1000;

export function saveListingScroll(
  snap: Omit<ListingScrollSnapshot, 'savedAt'>
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: ListingScrollSnapshot = { ...snap, savedAt: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

export function peekListingScroll(): ListingScrollSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ListingScrollSnapshot;
    if (!data || typeof data.y !== 'number') return null;
    if (Date.now() - (data.savedAt || 0) > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** Read and clear snapshot. */
export function takeListingScroll(): ListingScrollSnapshot | null {
  const data = peekListingScroll();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
  return data;
}
