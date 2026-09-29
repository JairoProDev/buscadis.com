'use client';

import { useEffect, useMemo, useState } from 'react';
import { isBuscadisNativeApp } from '@/lib/mobile-app-bridge';

function readSearchString(initial?: Record<string, string | undefined>): string {
  if (typeof window !== 'undefined') {
    return window.location.search || '';
  }
  const params = new URLSearchParams();
  if (initial) {
    for (const [key, value] of Object.entries(initial)) {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      }
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Avoids Next.js useSearchParams() Suspense stalls in the native WebView shell.
 */
export function useStableSearchParams(
  initial?: Record<string, string | undefined>
): URLSearchParams {
  const [search, setSearch] = useState(() => readSearchString(initial));

  useEffect(() => {
    const sync = () => setSearch(window.location.search || '');
    sync();
    window.addEventListener('popstate', sync);
    const id = window.setInterval(sync, isBuscadisNativeApp() ? 350 : 2000);
    return () => {
      window.removeEventListener('popstate', sync);
      window.clearInterval(id);
    };
  }, []);

  return useMemo(() => {
    const raw = search.startsWith('?') ? search.slice(1) : search;
    return new URLSearchParams(raw);
  }, [search]);
}
