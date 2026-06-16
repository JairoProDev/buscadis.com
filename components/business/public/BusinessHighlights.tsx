'use client';

import type { CustomBlock } from '@/types/business';
import { IconArrowRight } from '@/components/Icons';

interface BusinessHighlightsProps {
  announcementText?: string;
  announcementActive?: boolean;
  customBlocks?: CustomBlock[];
}

export default function BusinessHighlights({
  announcementText,
  announcementActive,
  customBlocks = [],
}: BusinessHighlightsProps) {
  const linkBlocks = customBlocks.filter((b) => b.type === 'link' && b.content);

  return (
    <>
      {announcementActive !== false && announcementText && (
        <div className="bg-yellow-300 text-yellow-900 text-center text-xs md:text-sm font-bold py-2 px-4 sticky top-0 z-50 shadow-sm print:hidden">
          📢 {announcementText}
        </div>
      )}

      {linkBlocks.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-4 flex gap-3 overflow-x-auto no-scrollbar print:hidden">
          {linkBlocks.slice(0, 6).map((block) => (
            <a
              key={block.id}
              href={block.content}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-bold text-slate-700 hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] transition-colors shadow-sm"
            >
              {block.label || 'Enlace'}
              <IconArrowRight size={14} />
            </a>
          ))}
        </div>
      )}
    </>
  );
}
