export type ConsentCategory = 'essential' | 'analytics' | 'marketing';

export type ConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

const CONSENT_KEY = 'buscadis_consent';
const CONSENT_EVENT = 'buscadis:consent-change';

const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
  decidedAt: '',
};

export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.marketing !== 'boolean') {
      return null;
    }
    return { ...DEFAULT_CONSENT, ...parsed, essential: true };
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  const consent = getConsent();
  return consent?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  const consent = getConsent();
  return consent?.marketing === true;
}

export function saveConsent(partial: Pick<ConsentState, 'analytics' | 'marketing'>): ConsentState {
  const next: ConsentState = {
    essential: true,
    analytics: partial.analytics,
    marketing: partial.marketing,
    decidedAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next }));
  }
  return next;
}

export function acceptAllConsent(): ConsentState {
  return saveConsent({ analytics: true, marketing: true });
}

export function acceptEssentialOnly(): ConsentState {
  return saveConsent({ analytics: false, marketing: false });
}

export function subscribeConsent(listener: (consent: ConsentState) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ConsentState>).detail;
    if (detail) listener(detail);
  };

  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
