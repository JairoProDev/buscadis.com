'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DealClip, DealFeedTab } from '@/types';
import { fetchDealFeed } from '@/lib/deals/client';
import { useAuth } from '@/hooks/useAuth';

export function useDealsFeed(initialClipId?: string) {
  const { session } = useAuth();
  const token = session?.access_token;
  const [tab, setTab] = useState<DealFeedTab>('for_you');
  const [clips, setClips] = useState<DealClip[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const cursorRef = useRef<string | undefined>();

  const load = useCallback(
    async (append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const data = await fetchDealFeed({
          tab,
          cursor: append ? cursorRef.current : undefined,
          clipId: !append && initialClipId ? initialClipId : undefined,
          token,
        });

        setClips((prev) => (append ? [...prev, ...data.clips] : data.clips));
        cursorRef.current = data.nextCursor;
        setNextCursor(data.nextCursor);
      } catch (e) {
        console.error('[useDealsFeed]', e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [tab, token, initialClipId]
  );

  useEffect(() => {
    cursorRef.current = undefined;
    setActiveIndex(0);
    load(false);
  }, [tab, load]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return;
    load(true);
  }, [nextCursor, loadingMore, load]);

  const updateClip = useCallback((clipId: string, patch: Partial<DealClip>) => {
    setClips((prev) => prev.map((c) => (c.id === clipId ? { ...c, ...patch } : c)));
  }, []);

  return {
    tab,
    setTab,
    clips,
    activeIndex,
    setActiveIndex,
    loading,
    loadingMore,
    loadMore,
    updateClip,
    reload: () => load(false),
  };
}
