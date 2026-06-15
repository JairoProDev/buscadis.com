'use client';

import { Story, StoryGroup } from '@/types';
import { STORY_RAIL, ringClassFor } from './story-rail-styles';

interface UserStoryCardProps {
  group: StoryGroup;
  width: number;
  height: number;
  avatarSize: number;
  onClick: () => void;
}

function previewStory(group: StoryGroup): Story {
  return group.stories[0];
}

export default function UserStoryCard({
  group,
  width,
  height,
  avatarSize,
  onClick,
}: UserStoryCardProps) {
  const story = previewStory(group);
  const name = group.vendedor?.nombre || 'Usuario';
  const ring = ringClassFor(group.topTier, group.hasUnseen);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex-shrink-0 overflow-hidden border border-[var(--border-color)] text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]"
      style={{
        width,
        height,
        borderRadius: STORY_RAIL.radius,
      }}
      aria-label={`Historia de ${name}, ${group.stories.length} publicación${group.stories.length === 1 ? '' : 'es'}${group.hasUnseen ? ', sin ver' : ''}`}
    >
      {/* Preview a pantalla completa */}
      <div className="absolute inset-0 bg-[var(--bg-tertiary)]">
        {story.media_type === 'video' ? (
          <video
            src={story.media_url}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={story.media_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Degradado para legibilidad */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/5 to-black/70"
        aria-hidden
      />

      {/* Avatar con anillo de estado */}
      <div
        className={`absolute left-2 top-2 rounded-full p-[2.5px] ${ring} ${
          group.hasUnseen ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.35)]' : ''
        }`}
      >
        <div
          className="overflow-hidden rounded-full border-2 border-white bg-[var(--bg-tertiary)]"
          style={{ width: avatarSize, height: avatarSize }}
        >
          {group.vendedor?.avatarUrl ? (
            <img src={group.vendedor.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Contador de historias (estilo IG cuando hay varias) */}
      {group.stories.length > 1 && (
        <span
          className="pointer-events-none absolute right-2 top-2 z-[1] flex h-5 min-w-[20px] items-center justify-center rounded-md bg-black/55 px-1.5 text-[10px] font-bold text-white backdrop-blur-sm"
          aria-hidden
        >
          {group.stories.length}
        </span>
      )}

      {/* Indicador de video */}
      {story.media_type === 'video' && (
        <span
          className={`pointer-events-none absolute rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white ${
            group.stories.length > 1 ? 'right-2 top-8' : 'right-2 top-2'
          }`}
          aria-hidden
        >
          ▶
        </span>
      )}

      {/* Nombre */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-6">
        <span className="block truncate text-[11px] font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {name}
        </span>
      </div>
    </button>
  );
}
