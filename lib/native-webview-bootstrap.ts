/**
 * Native WebView (Expo shell): PWA service workers often serve stale JS →
 * infinite loading and global-error after chunk mismatch.
 */
export function isNativeWebViewClient(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.__BUSCADIS_APP__ === true ||
    window.localStorage.getItem('isBuscadisApp') === 'true' ||
    /BuscadisApp\//i.test(window.navigator.userAgent || '')
  );
}

export async function bootstrapNativeWebView(): Promise<void> {
  if (!isNativeWebViewClient()) return;

  document.documentElement.setAttribute('data-buscadis-app', 'true');

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // non-blocking
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.includes('workbox') || k.includes('next') || k.includes('buscadis'))
          .map((k) => caches.delete(k))
      );
    }
  } catch {
    // non-blocking
  }
}
