'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  getActiveStories,
  groupStoriesByUser,
  getSeenStoryIds,
  getServerSeenStoryIds,
} from '@/lib/stories';
import { getUserInterestProfile } from '@/lib/interactions';
import { StoryGroup } from '@/types';
import { IconChevronRight } from '@/components/Icons';
import StoryViewer from './StoryViewer';
import StoryUploadModal from './StoryUploadModal';
import CreateStoryCard from './stories/CreateStoryCard';
import UserStoryCard from './stories/UserStoryCard';
import { STORY_RAIL } from './stories/story-rail-styles';

interface StoriesBarProps {
  categoria?: string;
}

export default function StoriesBar({ categoria }: StoriesBarProps) {
  const { user, profile, session } = useAuth();
  const { openAuthModal } = useUI();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const cardW = isDesktop ? STORY_RAIL.cardW.desktop : STORY_RAIL.cardW.mobile;
  const cardH = isDesktop ? STORY_RAIL.cardH.desktop : STORY_RAIL.cardH.mobile;
  const avatarSize = isDesktop ? STORY_RAIL.avatar.desktop : STORY_RAIL.avatar.mobile;

  const loadStories = useCallback(async () => {
    const stories = await getActiveStories({
      categoria,
      token: session?.access_token,
    });

    const localSeen = getSeenStoryIds();
    let serverSeen: Set<string> | undefined;
    let interestProfile = null;

    if (user?.id) {
      serverSeen = await getServerSeenStoryIds(user.id);
      interestProfile = await getUserInterestProfile(user.id);
    }

    const seen = serverSeen?.size ? serverSeen : localSeen;

    setGroups(
      groupStoriesByUser(stories, seen, {
        serverSeenStoryIds: serverSeen,
        interestProfile,
      })
    );
    setLoaded(true);
  }, [categoria, user?.id, session?.access_token]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    const onRefresh = () => {
      void loadStories();
    };
    window.addEventListener('buscadis:stories-refresh', onRefresh);
    return () => window.removeEventListener('buscadis:stories-refresh', onRefresh);
  }, [loadStories]);

  const updateScrollHint = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollHint();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollHint, { passive: true });
    window.addEventListener('resize', updateScrollHint);
    return () => {
      el.removeEventListener('scroll', updateScrollHint);
      window.removeEventListener('resize', updateScrollHint);
    };
  }, [groups, loaded, updateScrollHint, isDesktop]);

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: (cardW + STORY_RAIL.gap) * 2, behavior: 'smooth' });
  };

  const handleAddClick = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setShowUpload(true);
  };

  const otherGroups = user ? groups.filter((g) => g.userId !== user.id) : groups;
  const myGroup = user ? groups.find((g) => g.userId === user.id) : undefined;
  const filterActive = Boolean(categoria && categoria !== 'todos');

  if (!loaded) {
    return (
      <div
        className="flex gap-2 overflow-hidden px-0.5"
        style={{ minHeight: cardH }}
        aria-hidden
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton-shimmer flex-shrink-0"
            style={{ width: cardW, height: cardH, borderRadius: STORY_RAIL.radius }}
          />
        ))}
      </div>
    );
  }

  if (filterActive && groups.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border-color)] px-4 py-6 text-center"
        style={{ minHeight: cardH * 0.6 }}
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Sé el primero en publicar una historia en{' '}
          <span className="font-semibold text-[var(--text-primary)]">{categoria}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex items-stretch overflow-x-auto no-scrollbar scroll-smooth"
        style={{ gap: STORY_RAIL.gap, paddingBottom: 2 }}
      >
        <CreateStoryCard
          width={cardW}
          height={cardH}
          avatarUrl={profile?.avatar_url}
          label={myGroup ? 'Añadir' : 'Crear historia'}
          onClick={handleAddClick}
        />

        {myGroup && (
          <UserStoryCard
            group={myGroup}
            width={cardW}
            height={cardH}
            avatarSize={avatarSize}
            onClick={() => setViewerIndex(groups.indexOf(myGroup))}
          />
        )}

        {otherGroups.map((group) => (
          <UserStoryCard
            key={group.userId}
            group={group}
            width={cardW}
            height={cardH}
            avatarSize={avatarSize}
            onClick={() => setViewerIndex(groups.indexOf(group))}
          />
        ))}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] shadow-md transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--brand-blue)]"
          aria-label="Ver más historias"
        >
          <IconChevronRight size={14} />
        </button>
      )}

      {viewerIndex !== null && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerIndex}
          onClose={() => {
            setViewerIndex(null);
            loadStories();
          }}
        />
      )}

      {showUpload && (
        <StoryUploadModal
          onClose={() => setShowUpload(false)}
          onPublished={() => {
            setShowUpload(false);
            loadStories();
          }}
        />
      )}
    </div>
  );
}
