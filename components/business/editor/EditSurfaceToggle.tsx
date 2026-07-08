'use client';

import { cn } from '@/lib/utils';
import type { EditSurface } from '@/contexts/ProfileEditContext';

interface EditSurfaceToggleProps {
  value: EditSurface;
  onChange: (surface: EditSurface) => void;
  className?: string;
}

export default function EditSurfaceToggle({ value, onChange, className }: EditSurfaceToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold',
        className
      )}
      role="group"
      aria-label="Modo de edición"
    >
      <button
        type="button"
        onClick={() => onChange('panel')}
        className={cn(
          'px-3 py-1.5 rounded-lg transition-all',
          value === 'panel'
            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
            : 'text-slate-500 hover:text-slate-700'
        )}
        title="Edita desde el panel lateral"
      >
        Formulario
      </button>
      <button
        type="button"
        onClick={() => onChange('direct')}
        className={cn(
          'px-3 py-1.5 rounded-lg transition-all',
          value === 'direct'
            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
            : 'text-slate-500 hover:text-slate-700'
        )}
        title="Toca lo que quieres cambiar"
      >
        Clic directo
      </button>
    </div>
  );
}
