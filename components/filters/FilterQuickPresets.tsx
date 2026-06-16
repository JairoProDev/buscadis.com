'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Categoria } from '@/types';
import { BrowseFilterState } from '@/lib/filters/types';
import { SMART_FILTER_PRESETS, applySmartPreset } from '@/lib/filters/smart-presets';
import { IconChevronDown, IconClock, IconMedal, IconShield, IconTag, IconZap } from '@/components/Icons';
import { useFilterSectionCollapse } from './useFilterSectionCollapse';

const PRESET_ICONS: Record<string, React.ReactNode> = {
  mejores: <IconMedal size={12} />,
  recientes: <IconClock size={12} />,
  confiables: <IconShield size={12} />,
  economicos: <IconTag size={12} />,
  hoy: <IconZap size={12} />,
};

interface FilterQuickPresetsProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
}

export default function FilterQuickPresets({ categoria, filters, onChange }: FilterQuickPresetsProps) {
  const { open, toggle } = useFilterSectionCollapse('atajos', false);

  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/80 p-3">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--brand-blue)]">
          <IconZap size={14} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-[var(--text-primary)]">Atajos inteligentes</span>
          <span className="block text-[10px] text-[var(--text-tertiary)]">
            {open ? 'Combinaciones en 1 toque' : `${SMART_FILTER_PRESETS.length} atajos · toca para ver`}
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
            key="presets"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 pt-2.5">
              {SMART_FILTER_PRESETS.map((preset) => (
                <motion.button
                  key={preset.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const next = applySmartPreset(preset.id, filters, categoria);
                    if (next) onChange(next);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-2 text-left transition-colors hover:border-[rgba(var(--brand-primary-rgb),0.35)] hover:bg-[rgba(var(--brand-primary-rgb),0.04)]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--brand-blue)]">
                    {PRESET_ICONS[preset.id] ?? <IconZap size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold text-[var(--text-primary)]">{preset.label}</span>
                    <span className="block truncate text-[10px] text-[var(--text-tertiary)]">{preset.description}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
