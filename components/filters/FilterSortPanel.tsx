'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TipoOrdenamiento } from '@/components/Ordenamiento';
import { IconChevronDown, IconSortDown, IconSortUp } from '@/components/Icons';
import { useFilterSectionCollapse } from './useFilterSectionCollapse';

const SORT_OPTIONS: {
  value: TipoOrdenamiento;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'recientes', label: 'Más recientes', icon: <IconSortDown size={11} /> },
  { value: 'precio-asc', label: 'Menor precio', icon: <IconSortUp size={11} /> },
  { value: 'precio-desc', label: 'Mayor precio', icon: <IconSortDown size={11} /> },
  { value: 'antiguos', label: 'Más antiguos', icon: <IconSortUp size={11} /> },
];

interface FilterSortPanelProps {
  value: TipoOrdenamiento;
  onChange: (value: TipoOrdenamiento) => void;
}

export default function FilterSortPanel({ value, onChange }: FilterSortPanelProps) {
  const { open, toggle } = useFilterSectionCollapse('ordenar', false);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/80 p-3">
      <button type="button" onClick={toggle} className="flex w-full items-center gap-2 text-left">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--brand-blue)]">
          <IconSortDown size={14} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-[var(--text-primary)]">Ordenar resultados</span>
          <span className="block truncate text-[10px] text-[var(--text-tertiary)]">
            {open ? 'Elige cómo ver los avisos' : `Actual: ${current.label}`}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[var(--text-tertiary)]"
        >
          <IconChevronDown size={12} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="sort"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-1.5 pt-2.5">
              {SORT_OPTIONS.map((opt) => {
                const selected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`flex items-center gap-1.5 rounded-xl px-2 py-2 text-left text-[10px] font-semibold transition-all ${
                      selected
                        ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className={selected ? 'text-white' : 'text-[var(--brand-blue)]'}>{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
