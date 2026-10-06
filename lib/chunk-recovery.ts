/** Detect Next/Webpack lazy chunk load failures (stale PWA cache after deploy). */
export function isChunkLoadError(reason: unknown): boolean {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : '';
  const normalized = message.toLowerCase();
  return (
    normalized.includes('loading chunk') ||
    normalized.includes('chunkloaderror') ||
    normalized.includes('failed to fetch dynamically imported module') ||
    normalized.includes('importing a module script failed')
  );
}

const RELOAD_GUARD_KEY = 'buscadis_chunk_reload_ts';
const RELOAD_COOLDOWN_MS = 30_000;

export function shouldAttemptChunkReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || '0');
    return Date.now() - last > RELOAD_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markChunkReloadAttempted(): void {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export async function clearStaleClientCaches(): Promise<void> {
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
          .filter(
            (k) =>
              k.includes('workbox') ||
              k.includes('next') ||
              k.includes('buscadis') ||
              k.includes('pages')
          )
          .map((k) => caches.delete(k))
      );
    }
  } catch {
    // non-blocking
  }
}

export async function recoverFromChunkError(): Promise<void> {
  if (!shouldAttemptChunkReload()) return;
  markChunkReloadAttempted();
  await clearStaleClientCaches();
  window.location.reload();
}
