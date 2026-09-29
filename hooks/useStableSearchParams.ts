'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { isBuscadisNativeApp } from '@/lib/mobile-app-bridge';

function toSearchString(initial?: Record<string, string | undefined>): string {
  if (typeof window !== 'undefined') {
    return window.location.search;
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
  const pathname = usePathname();
  const [search, setSearch] = useState(() => toSearchString(initial));

  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);

  useEffect(() => {
    if (!isBuscadisNativeApp()) return;
    const sync = () => {
      const next = window.location.search;
      setSearch((prev) => (prev !== next ? next : prev));
    };
    const id = window.setInterval(sync, 400);
    window.addEventListener('popstate', sync);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('popstate', sync);
    };
  }, [pathname]);

  return useMemo(() => new URLSearchParams(search.replace(/^\?/, '')), [search]);
}
