import { signInWithGoogleIdToken } from '@/lib/auth';
import {
  createGoogleNonce,
  getGoogleClientId,
  loadGisScript,
  type GisCredentialResponse,
} from '@/lib/auth/google-gis';

type PromptNotification = {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
};

let nonceRef: string | null = null;
let initPromise: Promise<boolean> | null = null;
let afterSignIn: (() => void | Promise<void>) | null = null;
let promptInFlight: Promise<boolean> | null = null;

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(max-width: 767px)').matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

async function ensureInitialized(): Promise<boolean> {
  const clientId = getGoogleClientId();
  if (!clientId) return false;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await loadGisScript();
      if (!window.google?.accounts?.id) return false;

      const { nonce, hashedNonce } = await createGoogleNonce();
      nonceRef = nonce;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: GisCredentialResponse) => {
          if (!response?.credential) return;
          const { error } = await signInWithGoogleIdToken(
            response.credential,
            nonceRef || undefined
          );
          if (error) {
            console.error('Google sign-in failed', error);
            return;
          }
          await afterSignIn?.();
        },
        nonce: hashedNonce,
        use_fedcm_for_prompt: !isMobileViewport(),
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        itp_support: true,
      });
      return true;
    } catch (e) {
      console.warn('Google Identity init failed', e);
      initPromise = null;
      return false;
    }
  })();

  return initPromise;
}

async function runPrompt(): Promise<boolean> {
  const ready = await ensureInitialized();
  if (!ready || !window.google?.accounts?.id) return false;

  try {
    window.google.accounts.id.cancel();
  } catch {
    /* ignore */
  }

  await new Promise((r) => setTimeout(r, 80));

  return new Promise((resolve) => {
    window.google!.accounts!.id!.prompt((notification: PromptNotification) => {
      const notShown =
        notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.();
      if (notShown) {
        window.dispatchEvent(new CustomEvent('buscadis:google-one-tap-unavailable'));
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/** Selector de cuentas Google (One Tap). Una sola petición FedCM a la vez. */
export async function promptGoogleSignIn(
  onAuthenticated?: () => void | Promise<void>
): Promise<boolean> {
  afterSignIn = onAuthenticated ?? null;

  if (promptInFlight) {
    return promptInFlight;
  }

  promptInFlight = runPrompt().finally(() => {
    promptInFlight = null;
  });

  return promptInFlight;
}

export function requestGoogleSignInPrompt(
  onAuthenticated?: () => void | Promise<void>
): void {
  void promptGoogleSignIn(onAuthenticated);
}
