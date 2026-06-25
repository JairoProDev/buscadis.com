const UTM_STORAGE_KEY = 'buscadis_utm';
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type UtmAttribution = Partial<Record<(typeof UTM_PARAMS)[number], string>>;

function readFromUrl(): UtmAttribution {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm: UtmAttribution = {};
  for (const key of UTM_PARAMS) {
    const value = params.get(key)?.trim();
    if (value) utm[key] = value;
  }
  return utm;
}

export function captureUtmFromUrl(): UtmAttribution {
  if (typeof window === 'undefined') return {};
  const fromUrl = readFromUrl();
  if (Object.keys(fromUrl).length === 0) return getStoredUtm();

  try {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
  } catch {
    // ignore storage errors
  }
  return fromUrl;
}

export function getStoredUtm(): UtmAttribution {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UtmAttribution;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getAttributionContext(): Record<string, string> {
  const utm = captureUtmFromUrl();
  const context: Record<string, string> = {};
  for (const [key, value] of Object.entries(utm)) {
    if (value) context[key] = value;
  }
  return context;
}

export function parseUtmFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UtmAttribution {
  const utm: UtmAttribution = {};
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key)?.trim() || undefined;
    }
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0]?.trim() || undefined;
    return value?.trim() || undefined;
  };

  for (const key of UTM_PARAMS) {
    const value = get(key);
    if (value) utm[key] = value;
  }
  return utm;
}
