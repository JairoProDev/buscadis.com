'use client';

import { cn } from '@/lib/utils';

interface FieldLabelProps {
  number: number;
  label: string;
  complete?: boolean;
  className?: string;
}

export default function FieldLabel({ number, label, complete, className }: FieldLabelProps) {
  return (
    <span
      className={cn(
        'text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wide flex items-center gap-2',
        className
      )}
    >
      <span
        className={cn(
          'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 tabular-nums',
          complete
            ? 'bg-slate-100 text-slate-400'
            : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
        )}
      >
        {number}
      </span>
      <span className={cn(complete && 'text-slate-500')}>{label}</span>
    </span>
  );
}
