'use client';

import type { StoryHighlight } from '@buscadis/profile-engine';
import { cn } from '@/lib/utils';

interface ProfileStoryHighlightsProps {
  highlights: StoryHighlight[];
  /** Si la portada coincide con el banner, se muestra inicial en lugar de imagen repetida */
  bannerImageUrl?: string | null;
  className?: string;
}

function normalizeImageKey(url?: string | null): string | null {
  if (!url?.trim()) return null;
  const base = url.split('?')[0].split('/').pop()?.toLowerCase();
  return base || null;
}

export default function ProfileStoryHighlights({
  highlights,
  bannerImageUrl,
  className,
}: ProfileStoryHighlightsProps) {
  if (!highlights.length) return null;

  const bannerKey = normalizeImageKey(bannerImageUrl);

  return (
    <div className={cn('max-w-6xl mx-auto px-4 print:hidden', className)}>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
        {highlights.map((h) => {
          const coverKey = normalizeImageKey(h.coverUrl);
          const useInitial = !h.coverUrl || (bannerKey && coverKey === bannerKey);

          const inner = (
            <>
              <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full p-[2px] bg-gradient-to-tr from-[var(--brand-color)] to-[var(--brand-accent,#ec4899)]">
                <div className="w-full h-full rounded-full border-2 border-[var(--bg-secondary)] overflow-hidden bg-[var(--bg-secondary)]">
                  {!useInitial && h.coverUrl ? (
                    <img src={h.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base font-bold text-[var(--brand-color)] bg-[var(--brand-color)]/10">
                      {h.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] font-medium truncate max-w-[4.5rem] text-center leading-tight">
                {h.title}
              </span>
            </>
          );

          if (h.linkUrl) {
            return (
              <a
                key={h.id}
                href={h.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 shrink-0 snap-start"
              >
                {inner}
              </a>
            );
          }

          return (
            <div key={h.id} className="flex flex-col items-center gap-1 shrink-0 snap-start">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
