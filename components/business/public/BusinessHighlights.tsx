'use client';

import type { CustomBlock } from '@/types/business';

interface BusinessHighlightsProps {
  announcementText?: string;
  announcementActive?: boolean;
  customBlocks?: CustomBlock[];
}

export default function BusinessHighlights({
  announcementText,
  announcementActive,
}: BusinessHighlightsProps) {
  if (announcementActive === false || !announcementText) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-3 print:hidden">
      <div
        className="rounded-[var(--bp-radius)] border border-amber-200/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 text-center text-xs md:text-sm font-semibold py-2.5 px-4"
        role="status"
      >
        📢 {announcementText}
      </div>
    </div>
  );
}
