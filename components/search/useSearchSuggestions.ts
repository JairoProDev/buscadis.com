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
}

const cache = new Map<string, SuggestionsState>();
const CACHE_MAX = 40;

export function useSearchSuggestions(query: string, enabled = true): SuggestionsState {
  const [state, setState] = useState<SuggestionsState>({
    adisos: [],
    queries: [],
    completion: null,
    loading: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setState({ adisos: [], queries: [], completion: null, loading: false });
      return;
    }

    const cached = cache.get(trimmed.toLowerCase());
    if (cached) {
      setState({ ...cached, loading: false });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((s) => ({ ...s, loading: true }));

    try {
      const res = await fetch(
        `/api/search/suggest?q=${encodeURIComponent(trimmed)}&limit=8`,
        { signal: controller.signal },
      );
      if (!res.ok) throw new Error('suggest failed');
      const data = (await res.json()) as SuggestionsState;
      const next = {
        adisos: data.adisos ?? [],
        queries: data.queries ?? [],
        completion: data.completion ?? null,
        loading: false,
      };
      if (cache.size >= CACHE_MAX) {
        const first = cache.keys().next().value;
        if (first) cache.delete(first);
      }
      cache.set(trimmed.toLowerCase(), next);
      setState(next);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState({ adisos: [], queries: [], completion: null, loading: false });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setState({ adisos: [], queries: [], completion: null, loading: false });
      return;
    }
    const t = window.setTimeout(() => void fetchSuggestions(trimmed), 120);
    return () => window.clearTimeout(t);
  }, [query, enabled, fetchSuggestions]);

  return state;
}
