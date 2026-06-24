'use client';

import { computeProfileProgress } from '@/lib/business/profile-progress';
import type { BusinessProfile } from '@/types/business';
import { cn } from '@/lib/utils';

interface EditorProgressWidgetProps {
  profile: Partial<BusinessProfile>;
  productCount?: number;
  className?: string;
}

export default function EditorProgressWidget({
  profile,
  productCount = 0,
  className,
}: EditorProgressWidgetProps) {
  const { score, milestoneLabel, missing } = computeProfileProgress(profile, productCount);

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-3', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600">Perfil que vende</span>
        <span className="text-xs font-black text-[var(--brand-blue,#53acc5)]">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--brand-blue,#53acc5)] transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
      {milestoneLabel && (
        <p className="text-[10px] font-semibold text-emerald-600 mt-1.5">{milestoneLabel}</p>
      )}
      {missing.length > 0 && (
        <p className="text-[10px] text-slate-400 mt-1">
          Te falta: {missing.slice(0, 2).join(', ')}
          {missing.length > 2 ? '…' : ''}
        </p>
      )}
    </div>
  );
}
