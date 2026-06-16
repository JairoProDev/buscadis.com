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

  return (
    <div className="mt-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Progreso
        </span>
        <span className="text-[9px] font-bold text-[var(--brand-blue)]">
          {completed}/{sections.length}
        </span>
      </div>
      <div className="flex gap-1">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            title={section.title}
            onClick={() => onJump?.(section.id)}
            className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-tertiary)]"
          >
            <motion.span
              layout
              initial={false}
              animate={{
                width: section.completed ? '100%' : section.active ? '55%' : '0%',
              }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute inset-y-0 left-0 rounded-full ${
                section.completed ? 'bg-[var(--brand-blue)]' : 'bg-[rgba(var(--brand-primary-rgb),0.45)]'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
