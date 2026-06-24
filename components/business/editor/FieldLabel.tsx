'use client';

import { IconCheck } from '@/components/Icons';
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
        'text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide flex items-center gap-2',
        className
      )}
    >
      <span
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0',
          complete ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
        )}
      >
        {complete ? <IconCheck size={10} /> : number}
      </span>
      {label}
    </span>
  );
}
