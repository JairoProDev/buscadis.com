'use client';

import { profilePageContainerClass } from '@/lib/business/profile-layout';
import { cn } from '@/lib/utils';

interface ProfileHashtagsProps {
  tags?: string[];
  className?: string;
}

export default function ProfileHashtags({ tags, className }: ProfileHashtagsProps) {
  if (!tags?.length) return null;

  const labels = tags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

  return (
    <div className={cn(profilePageContainerClass(), 'print:hidden', className)}>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap text-xs font-semibold text-[var(--brand-color)]">
        {labels.map((label, i) => (
          <span key={label}>
            {label}
            {i < labels.length - 1 && (
              <span className="text-[var(--text-tertiary)] font-normal mx-0.5">·</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
