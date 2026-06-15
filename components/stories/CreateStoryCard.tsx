'use client';

import { IconPlus } from '@/components/Icons';
import { STORY_RAIL } from './story-rail-styles';

interface CreateStoryCardProps {
  width: number;
  height: number;
  avatarUrl?: string;
  label?: string;
  onClick: () => void;
}

export default function CreateStoryCard({
  width,
  height,
  avatarUrl,
  label = 'Crear historia',
  onClick,
}: CreateStoryCardProps) {
  const previewH = Math.round(height * 0.68);
  const labelH = height - previewH;
  const plus = STORY_RAIL.plusBtn;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-shrink-0 overflow-hidden border border-[var(--border-color)] bg-[var(--bg-primary)] text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]"
      style={{
        width,
        height,
        borderRadius: STORY_RAIL.radius,
      }}
      aria-label={label}
    >
      {/* Vista previa superior: foto del usuario o fondo neutro */}
      <div
        className="absolute top-0 left-0 right-0 overflow-hidden bg-[var(--bg-tertiary)]"
        style={{ height: previewH }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgba(var(--brand-primary-rgb),0.12)] to-[rgba(var(--brand-yellow-rgb),0.1)]">
            <IconPlus size={28} className="text-[var(--brand-blue)] opacity-60" />
          </div>
        )}
      </div>

      {/* Pie con etiqueta */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-end justify-center border-t border-[var(--border-color)] bg-[var(--bg-primary)] px-1 pb-2.5 pt-1"
        style={{ height: labelH }}
      >
        <span className="text-center text-[11px] font-semibold leading-tight text-[var(--text-primary)]">
          {label}
        </span>
      </div>

      {/* Botón + superpuesto en la unión */}
      <span
        className="absolute left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[var(--bg-primary)] bg-[var(--brand-blue)] text-white shadow-md"
        style={{
          top: previewH,
          width: plus,
          height: plus,
        }}
        aria-hidden
      >
        <IconPlus size={16} />
      </span>
    </button>
  );
}
