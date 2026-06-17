/**
 * Bridge between buscadis.com (WebView) and the native Expo shell.
 */

const PUSH_TOKEN_STORAGE_KEY = 'buscadis:expo-push-token';

declare global {
  interface Window {
    __BUSCADIS_APP__?: boolean;
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

export function isBuscadisNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.__BUSCADIS_APP__ === true ||
    window.localStorage.getItem('isBuscadisApp') === 'true'
  );
}

export function getStoredExpoPushToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY)?.trim();
  return token || null;
}

/** Notify native layer to (re)register push token with optional user id. */
export function syncNativePushUser(userId: string | null): void {
  if (!isBuscadisNativeApp()) return;
  window.ReactNativeWebView?.postMessage(
    JSON.stringify({
      type: 'sync_push_user',
      payload: { userId },
    })
  );
}

/**
 * Link Expo push token to the logged-in user via web session.
 * Fallback when native bridge is unavailable; uses token stored by the shell.
 */
export async function linkPushTokenToSession(userId: string | null): Promise<void> {
  if (!userId) return;

  const token = getStoredExpoPushToken();
  if (!token) {
    syncNativePushUser(userId);
    return;
  }

  try {
    await fetch('/api/mobile-push/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: 'android',
        userId,
      }),
    });
  } catch {
    syncNativePushUser(userId);
  }
}

/** Clear user link on logout (token stays for anonymous broadcast). */
export async function unlinkPushTokenFromSession(): Promise<void> {
  const token = getStoredExpoPushToken();
  syncNativePushUser(null);

  if (!token) return;

  try {
    await fetch('/api/mobile-push/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId: null }),
    });
  } catch {
    // Non-blocking.
  }
}
