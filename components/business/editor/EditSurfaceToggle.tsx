'use client';

import { cn } from '@/lib/utils';
import type { EditSurface } from '@/contexts/ProfileEditContext';
import { IconEdit, IconTouch } from '@/components/Icons';

interface EditSurfaceToggleProps {
  value: EditSurface;
  onChange: (surface: EditSurface) => void;
  className?: string;
}

export default function EditSurfaceToggle({ value, onChange, className }: EditSurfaceToggleProps) {
  return (
    <div
      className={cn('inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5', className)}
      role="group"
      aria-label="Modo de edición"
    >
      <button
        type="button"
        onClick={() => onChange('panel')}
        className={cn(
          'w-8 h-8 rounded-lg transition-all flex items-center justify-center',
          value === 'panel'
            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
            : 'text-slate-500 hover:text-slate-700'
        )}
        title="Modo: Guiado"
        aria-label="Modo guiado"
      >
        <IconEdit size={14} />
      </button>
      <button
        type="button"
        onClick={() => onChange('direct')}
        className={cn(
          'w-8 h-8 rounded-lg transition-all flex items-center justify-center',
          value === 'direct'
            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
            : 'text-slate-500 hover:text-slate-700'
        )}
        title="Modo: Tocar"
        aria-label="Modo tocar"
      >
        <IconTouch size={14} />
      </button>
    </div>
  );
}
