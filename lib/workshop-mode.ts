/** Taller / workshop UX flag (copy Adis). Persists in session so the app WebView keeps it. */
export const WORKSHOP_SESSION_KEY = 'buscadis_workshop';

export function enableWorkshopMode(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(WORKSHOP_SESSION_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function isWorkshopModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(WORKSHOP_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function workshopQueryFromUrl(search: URLSearchParams | { get: (k: string) => string | null }): boolean {
  const v = search.get('taller');
  return v === '1' || v === 'true';
}

export function isWorkshopActive(
  search: URLSearchParams | { get: (k: string) => string | null }
): boolean {
  return workshopQueryFromUrl(search) || isWorkshopModeEnabled();
}
