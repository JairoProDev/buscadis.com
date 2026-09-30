/**
 * Google Identity Services helpers (One Tap + botón) — sin redirect OAuth.
 */

export function getGoogleClientId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;
}

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/** FedCM en GIS provoca AbortError en consola (GSI_LOGGER) en dev. */
export function useFedcmForGooglePrompt(): boolean {
  return false;
}

function googleOneTapGloballyEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (!getGoogleClientId()) return false;
  if (process.env.NEXT_PUBLIC_DISABLE_GOOGLE_ONE_TAP === '1') return false;
  if (isLocalDevHost()) return false;
  return true;
}

/** One Tap GIS al cargar (web móvil + desktop). No en localhost ni WebView nativa. */
export function shouldAutoPromptGoogleOneTap(): boolean {
  return googleOneTapGloballyEnabled();
}

/** Login Google nativo automático al abrir la app (WebView). GIS no funciona ahí. */
export function shouldAutoPromptNativeGoogleSignIn(): boolean {
  return googleOneTapGloballyEnabled();
}

/** One Tap / nativo antes de abrir el modal de login. */
export function shouldTryGoogleOneTapBeforeModal(): boolean {
  return googleOneTapGloballyEnabled();
}

export async function createGoogleNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
  const hashedNonce = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');
  return { nonce, hashedNonce };
}

export type GisCredentialResponse = {
  credential: string;
  select_by?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (cb?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; getNotDisplayedReason?: () => string }) => void) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          cancel: () => void;
          revoke: (hint: string, cb: () => void) => void;
        };
      };
    };
  }
}

let gisScriptPromise: Promise<void> | null = null;

export function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-gis]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGis = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  });

  return gisScriptPromise;
}
