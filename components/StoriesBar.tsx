'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { getActiveStories, groupStoriesByUser, getSeenStoryIds } from '@/lib/stories';
import { StoryGroup } from '@/types';
import { IconPlus } from '@/components/Icons';
import StoryViewer from './StoryViewer';
import StoryUploadModal from './StoryUploadModal';

const RING_CLASSES: Record<StoryGroup['topTier'], string> = {
  premium: 'bg-gradient-to-tr from-[var(--brand-blue)] via-[var(--brand-yellow)] to-[var(--brand-blue)]',
  destacada: 'bg-[var(--brand-yellow)]',
  gratis: 'bg-[var(--brand-blue)]',
};

export default function StoriesBar() {
  const { user, profile } = useAuth();
  const { openAuthModal } = useUI();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const loadStories = useCallback(async () => {
    const stories = await getActiveStories();
    const seen = getSeenStoryIds();
    setGroups(groupStoriesByUser(stories, seen));
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const handleAddClick = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setShowUpload(true);
  };

  if (loaded && groups.length === 0 && !user) return null;

  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-1 pb-2">
      <button
        type="button"
        onClick={handleAddClick}
        className="flex flex-col items-center gap-1 flex-shrink-0 w-16"
      >
        <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-[var(--brand-blue)] flex items-center justify-center bg-[var(--bg-tertiary)] overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <IconPlus size={20} className="text-[var(--brand-blue)]" />
          )}
        </div>
        <span className="text-[11px] text-[var(--text-secondary)] truncate w-full text-center">
          Tu historia
        </span>
      </button>

      {groups.map((group, i) => (
        <button
          key={group.userId}
          type="button"
          onClick={() => setViewerIndex(i)}
          className="flex flex-col items-center gap-1 flex-shrink-0 w-16"
        >
          <div
            className={`w-14 h-14 rounded-full p-[2px] ${
              group.hasUnseen ? RING_CLASSES[group.topTier] : 'bg-[var(--border-color)]'
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-tertiary)] border-2 border-[var(--bg-primary)] flex items-center justify-center">
              {group.vendedor?.avatarUrl ? (
                <img src={group.vendedor.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-[var(--text-secondary)]">
                  {(group.vendedor?.nombre || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] truncate w-full text-center">
            {group.vendedor?.nombre || 'Usuario'}
          </span>
        </button>
      ))}

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
