'use client';

import type { ReactNode } from 'react';
import type { ProfileMetricValue } from '@buscadis/profile-engine';
import {
  IconEye,
  IconHeart,
  IconMessages,
  IconShoppingCart,
  IconStar,
  IconStore,
  IconUsers,
} from '@/components/Icons';
import { cn } from '@/lib/utils';

function formatMetric(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function MetricIcon({ metricKey, index }: { metricKey: string; index: number }) {
  const size = 18;
  const accent = index % 2 === 1 ? 'text-[var(--brand-accent)]' : 'text-[var(--brand-color)]';
  const wrap = (node: ReactNode) => (
    <span className={accent}>{node}</span>
  );

  switch (metricKey) {
    case 'interactions':
      return wrap(<IconMessages size={size} />);
    case 'views':
      return wrap(<IconEye size={size} />);
    case 'sales':
      return wrap(<IconShoppingCart size={size} />);
    case 'clients':
    case 'followers':
      return wrap(<IconUsers size={size} />);
    case 'reviews':
      return wrap(<IconStar size={size} />);
    case 'products':
    case 'content_count':
      return wrap(<IconStore size={size} />);
    default:
      return wrap(<IconHeart size={size} />);
  }
}

interface ProfileMetricsProps {
  metrics: ProfileMetricValue[];
  className?: string;
}

export default function ProfileMetrics({ metrics, className }: ProfileMetricsProps) {
  if (!metrics.length) return null;
  const shown = metrics.slice(0, 3);

  return (
    <div
      className={cn(
        'flex items-stretch gap-3 sm:gap-5 flex-1 min-w-0',
        className
      )}
    >
      {shown.map((m, index) => (
        <div key={m.key} className="flex flex-col items-center justify-end min-w-[4rem] sm:min-w-[4.5rem]">
          <div className="flex items-center gap-1 text-[var(--text-primary)] font-bold text-sm sm:text-base">
            <MetricIcon metricKey={m.key} index={index} />
            <span className="tabular-nums">{formatMetric(m.value)}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-[var(--text-tertiary)] font-medium mt-1 text-center leading-tight">
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}
