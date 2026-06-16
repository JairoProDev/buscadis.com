'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCheck, IconChevronDown } from '@/components/Icons';
import { useFilterSectionCollapse } from './useFilterSectionCollapse';

interface FilterSectionCardProps {
  sectionId: string;
  step: number;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  completed?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export default function FilterSectionCard({
  sectionId,
  step,
  title,
  subtitle,
  icon,
  children,
  active,
  completed,
  collapsible = true,
  defaultOpen = false,
}: FilterSectionCardProps) {
  const { open, toggle } = useFilterSectionCollapse(sectionId, defaultOpen);

  return (
    <motion.section
      layout
      id={`filter-section-${sectionId}`}
      className={`scroll-mt-3 rounded-2xl border p-3 transition-colors ${
        active
          ? 'border-[rgba(var(--brand-primary-rgb),0.35)] bg-[rgba(var(--brand-primary-rgb),0.04)]'
          : 'border-[var(--border-color)] bg-[var(--bg-primary)]/80'
      }`}
    >
      <button
        type="button"
        onClick={() => collapsible && toggle()}
        disabled={!collapsible}
        className={`mb-0 flex w-full items-center gap-2 text-left ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold transition-colors ${
            completed
              ? 'bg-emerald-500 text-white'
              : active
                ? 'bg-[var(--brand-blue)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
          }`}
        >
          {completed ? <IconCheck size={10} color="white" /> : step}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--brand-blue)]">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-[var(--text-primary)]">{title}</span>
          {subtitle && (
            <span className="block truncate text-[10px] text-[var(--text-tertiary)]">{subtitle}</span>
          )}
        </span>
        {collapsible && (
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 text-[var(--text-tertiary)]"
          >
            <IconChevronDown size={12} />
          </motion.span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 pt-2.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
