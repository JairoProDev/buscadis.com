'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SuggestAdiso {
  id: string;
  titulo: string;
  categoria: string;
}

export interface SuggestionsState {
  adisos: SuggestAdiso[];
  queries: string[];
  completion: string | null;
  loading: boolean;
  popular: string[];
}

const cache = new Map<string, SuggestionsState>();
const CACHE_MAX = 40;
const EMPTY_KEY = '__popular__';

function emptyState(): SuggestionsState {
  return {
    adisos: [],
    queries: [],
    completion: null,
    loading: false,
    popular: [],
  };
}

export function useSearchSuggestions(query: string, enabled = true) {
  const [state, setState] = useState<SuggestionsState>(emptyState);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (q: string, mode: 'prefix' | 'popular') => {
    const cacheKey = mode === 'popular' ? EMPTY_KEY : q.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached) {
      setState({ ...cached, loading: false });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((s) => ({ ...s, loading: true }));

    try {
      const url =
        mode === 'popular'
          ? `/api/search/suggest?q=&limit=6`
          : `/api/search/suggest?q=${encodeURIComponent(q)}&limit=8`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('suggest failed');
      const data = (await res.json()) as {
        adisos?: SuggestAdiso[];
        queries?: string[];
        completion?: string | null;
      };
      const next: SuggestionsState =
        mode === 'popular'
          ? {
              adisos: [],
              queries: [],
              completion: null,
              loading: false,
              popular: data.queries ?? [],
            }
          : {
              adisos: data.adisos ?? [],
              queries: data.queries ?? [],
              completion: data.completion ?? null,
              loading: false,
              popular: [],
            };
      if (cache.size >= CACHE_MAX) {
        const first = cache.keys().next().value;
        if (first) cache.delete(first);
      }
      cache.set(cacheKey, next);
      setState(next);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState(emptyState());
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setState((s) => ({
        adisos: [],
        queries: [],
        completion: null,
        loading: false,
        popular: s.popular,
      }));
      return;
    }
    if (trimmed.length < 2) {
      setState(emptyState());
      return;
    }
    const t = window.setTimeout(() => void fetchSuggestions(trimmed, 'prefix'), 120);
    return () => window.clearTimeout(t);
  }, [query, enabled, fetchSuggestions]);

  const loadPopular = useCallback(() => {
    void fetchSuggestions('', 'popular');
  }, [fetchSuggestions]);

  return { ...state, loadPopular };
}
