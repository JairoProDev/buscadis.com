'use client';

import type { BusinessProfile } from '@/types/business';
import { getProfileChecklist } from '@/lib/business/profile-checklist';
import { IconCheck } from '@/components/Icons';
import { cn } from '@/lib/utils';

interface ProfileCompletenessChecklistProps {
  profile: Partial<BusinessProfile>;
  productCount: number;
  dealCount?: number;
  onNavigate?: (itemId: string) => void;
}

export default function ProfileCompletenessChecklist({
  profile,
  productCount,
  dealCount = 0,
  onNavigate,
}: ProfileCompletenessChecklistProps) {
  const { items, complete, score } = getProfileChecklist(profile, productCount, dealCount);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Perfil completo</h3>
        <span
          className={cn(
            'text-xs font-bold px-2 py-1 rounded-full',
            complete ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          )}
        >
          {score}%
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                'flex items-center gap-2 text-sm w-full text-left rounded-lg px-1 py-0.5 transition-colors',
                onNavigate && 'hover:bg-slate-50'
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                  item.done ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-300'
                )}
              >
                {item.done && <IconCheck size={12} />}
              </span>
              <span className={item.done ? 'text-slate-700' : 'text-slate-400'}>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
