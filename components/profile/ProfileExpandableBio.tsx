'use client';

import { useState, useRef, useEffect } from 'react';
import { profilePageContainerClass } from '@/lib/business/profile-layout';
import { cn } from '@/lib/utils';

interface ProfileExpandableBioProps {
  text?: string;
  maxLines?: number;
  className?: string;
}

export default function ProfileExpandableBio({
  text,
  maxLines = 3,
  className,
}: ProfileExpandableBioProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return;
    setNeedsExpand(el.scrollHeight > el.clientHeight + 2);
  }, [text, maxLines, expanded]);

  if (!text?.trim()) return null;

  return (
    <div className={cn(profilePageContainerClass(), className)}>
      <p
        ref={textRef}
        className={cn(
          'text-sm text-[var(--text-secondary)] leading-relaxed m-0 whitespace-pre-line',
          !expanded && 'line-clamp-3'
        )}
        style={
          !expanded
            ? {
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {text}
        {needsExpand && !expanded && (
          <>
            {' '}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline font-semibold text-[var(--brand-color)] hover:underline p-0 bg-transparent border-0 cursor-pointer align-baseline"
            >
              Ver más
            </button>
          </>
        )}
        {expanded && (
          <>
            {' '}
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline font-semibold text-[var(--brand-color)] hover:underline p-0 bg-transparent border-0 cursor-pointer align-baseline"
            >
              Ver menos
            </button>
          </>
        )}
      </p>
    </div>
  );
}
