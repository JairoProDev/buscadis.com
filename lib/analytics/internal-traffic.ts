'use client';

const EXCLUDE_KEY = 'buscadis_exclude_analytics';

/**
 * Excluye mediciones de GA4/Clarity para pruebas propias (localhost, flag manual).
 * No sustituye el filtro de tráfico interno en GA4 Admin (IP de oficina).
 */
export function shouldExcludeFromProductAnalytics(): boolean {
  if (typeof window === 'undefined') return false;

  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return true;
  }

  try {
    if (localStorage.getItem(EXCLUDE_KEY) === '1') return true;
    if (sessionStorage.getItem(EXCLUDE_KEY) === '1') return true;
  } catch {
    /* */
  }

  if (process.env.NEXT_PUBLIC_EXCLUDE_OWNER_ANALYTICS === 'true') {
    return true;
  }

  return false;
}

/** Consola: localStorage.setItem('buscadis_exclude_analytics','1') y recarga */
export function enableOwnerAnalyticsExclusion(persistent = true): void {
  if (typeof window === 'undefined') return;
  try {
    if (persistent) localStorage.setItem(EXCLUDE_KEY, '1');
    else sessionStorage.setItem(EXCLUDE_KEY, '1');
  } catch {
    /* */
  }
}

export function clearOwnerAnalyticsExclusion(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(EXCLUDE_KEY);
    sessionStorage.removeItem(EXCLUDE_KEY);
  } catch {
    /* */
  }
}
