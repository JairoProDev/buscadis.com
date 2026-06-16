'use client';

import type { CustomBlock } from '@/types/business';
import { getSocialIcon } from './social-icons';
import { IconArrowRight } from '@/components/Icons';

interface BusinessCustomBlocksProps {
  blocks: CustomBlock[];
}

export default function BusinessCustomBlocks({ blocks }: BusinessCustomBlocksProps) {
  if (!blocks.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">Enlaces</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map((block) => {
          if (block.type === 'text') {
            return (
              <div key={block.id} className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                {block.label && <p className="font-bold text-sm mb-1">{block.label}</p>}
                <p className="text-sm text-[var(--text-secondary)]">{block.content}</p>
              </div>
            );
          }
          if (!block.content) return null;
          return (
            <a
              key={block.id}
              href={block.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-[var(--brand-color)] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[var(--text-secondary)]">{getSocialIcon(block.content)}</span>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{block.label || 'Enlace'}</p>
                  {block.sublabel && (
                    <p className="text-xs text-slate-400 truncate">{block.sublabel}</p>
                  )}
                </div>
              </div>
              <IconArrowRight size={16} className="text-slate-300 group-hover:text-[var(--brand-color)]" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
