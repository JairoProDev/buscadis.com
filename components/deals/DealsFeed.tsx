'use client';

import DealClipCard from './DealClipCard';
import DealsTopTabs from './DealsTopTabs';
import DealEmptyState from './DealEmptyState';
import DealPublishWizard from './DealPublishWizard';
import DealLiveRail from './DealLiveRail';
import { useDealsFeed } from '@/hooks/useDealsFeed';
import { useRef, useEffect, useState } from 'react';
import { IconPlus } from '@/components/Icons';
import { DealLiveSession } from '@/types';

interface DealsFeedProps {
  initialClipId?: string;
}

export default function DealsFeed({ initialClipId }: DealsFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    tab,
    setTab,
    clips,
    activeIndex,
    setActiveIndex,
    loading,
    loadMore,
    updateClip,
  } = useDealsFeed(initialClipId);

  const [showPublish, setShowPublish] = useState(false);
  const [liveSessions, setLiveSessions] = useState<DealLiveSession[]>([]);

  useEffect(() => {
    fetch('/api/deals/live')
      .then((r) => r.json())
      .then((d) => setLiveSessions(d.sessions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const h = el.clientHeight;
      const idx = Math.round(el.scrollTop / h);
      if (idx !== activeIndex) setActiveIndex(idx);
      if (idx >= clips.length - 2) loadMore();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [activeIndex, clips.length, loadMore, setActiveIndex]);

  if (loading && clips.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!loading && clips.length === 0) {
    return (
      <>
        <DealEmptyState onCreate={() => setShowPublish(true)} />
        <DealPublishWizard open={showPublish} onClose={() => setShowPublish(false)} />
      </>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <DealsTopTabs active={tab} onChange={setTab} liveCount={liveSessions.length} />

      <DealLiveRail
        sessions={liveSessions}
        onJoin={(s) => {
          if (s.embed_url) window.open(s.embed_url, '_blank');
          else if (s.stream_url) window.open(s.stream_url, '_blank');
        }}
      />

      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {clips.map((clip, i) => (
          <div key={clip.id} className="h-full w-full shrink-0" style={{ height: '100%' }}>
            <DealClipCard
              clip={clip}
              isActive={i === activeIndex}
              onUpdate={(patch) => updateClip(clip.id, patch)}
              onNotInterested={() => {
                /* clip stays; feed reload on next visit */
              }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowPublish(true)}
        className="absolute bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-yellow)] shadow-lg md:bottom-8"
        aria-label="Crear deal"
      >
        <IconPlus size={28} color="#000" />
      </button>

      <DealPublishWizard open={showPublish} onClose={() => setShowPublish(false)} />
    </div>
  );
}
