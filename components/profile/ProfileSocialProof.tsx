'use client';

import { useEffect, useState } from 'react';
import type { SocialInsight } from '@buscadis/profile-engine';
import { IconEye } from '@/components/Icons';
import { profilePageContainerClass } from '@/lib/business/profile-layout';
import { cn } from '@/lib/utils';

interface ProfileSocialProofProps {
  insights: SocialInsight[];
  intervalMs?: number;
  className?: string;
}

function formatViewCount(raw: string): string {
  const n = Number.parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n)) return raw;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString('es-PE');
}

export default function ProfileSocialProof({
  insights,
  intervalMs = 3000,
  className,
}: ProfileSocialProofProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (insights.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % insights.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [insights.length, intervalMs]);

  if (!insights.length) return null;

  const current = insights[index];
  const isViewsAggregate = current.id === 'views-aggregate';

  return (
    <div className={cn(profilePageContainerClass(), 'print:hidden', className)}>
      <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 px-3 py-2">
        {isViewsAggregate ? (
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-color)]/10 text-[var(--brand-color)]">
              <IconEye size={16} />
            </span>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] m-0 min-w-0">
              <span className="font-bold text-[var(--text-primary)] tabular-nums">
                {formatViewCount(current.userName)}
              </span>{' '}
              {current.action}
            </p>
          </>
        ) : (
          <>
            <div className="flex -space-x-2 shrink-0">
              {insights
                .filter((ins) => ins.id !== 'views-aggregate')
                .slice(0, 3)
                .map((ins) => (
                  <div
                    key={ins.id}
                    className="w-8 h-8 rounded-full border-2 border-[var(--bg-primary)] bg-[var(--bg-secondary)] overflow-hidden flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)]"
                  >
                    {ins.avatarUrl ? (
                      <img src={ins.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      ins.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] m-0 min-w-0 transition-opacity duration-300">
              <span className="font-semibold text-[var(--text-primary)]">{current.userName}</span>{' '}
              {current.action}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
