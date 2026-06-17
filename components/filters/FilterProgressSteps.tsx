'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FilterSectionMeta } from '@/lib/filters/panel-meta';

interface FilterProgressStepsProps {
  sections: FilterSectionMeta[];
  onJump?: (sectionId: string) => void;
}

export default function FilterProgressSteps({ sections, onJump }: FilterProgressStepsProps) {
  const completed = sections.filter((s) => s.completed).length;
  const nextIncomplete = sections.find((s) => !s.completed);
  const pct = sections.length > 0 ? Math.round((completed / sections.length) * 100) : 0;

  return (
    <div className="mt-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Progreso de refinamiento
        </span>
        <span className="text-[9px] font-bold text-[var(--brand-blue)] tabular-nums">
          {completed}/{sections.length} · {pct}%
        </span>
      </div>
      <div className="flex gap-1" role="group" aria-label="Pasos de filtrado">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            title={`${section.title}${section.completed ? ' · completado' : section.active ? ' · en curso' : ''}`}
            onClick={() => onJump?.(section.id)}
            aria-label={`${section.title}, ${section.completed ? 'completado' : 'pendiente'}`}
            className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]"
          >
            <motion.span
              layout
              initial={false}
              animate={{
                width: section.completed ? '100%' : section.active ? '55%' : '0%',
              }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute inset-y-0 left-0 rounded-full ${
                section.completed
                  ? 'bg-[var(--brand-blue)]'
                  : 'bg-[rgba(var(--brand-primary-rgb),0.45)]'
              }`}
            />
          </button>
        ))}
      </div>
      {nextIncomplete ? (
        <p className="mt-1.5 text-[10px] leading-snug text-[var(--text-tertiary)]">
          Siguiente paso:{' '}
          <button
            type="button"
            onClick={() => onJump?.(nextIncomplete.id)}
            className="font-semibold text-[var(--brand-blue)] hover:underline"
          >
            {nextIncomplete.title}
          </button>
        </p>
      ) : completed === sections.length && sections.length > 0 ? (
        <p className="mt-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          Búsqueda refinada al máximo
        </p>
      ) : null}
    </div>
  );
}
