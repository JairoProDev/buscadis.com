'use client';

import React from 'react';
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

/** Filter section — CSS expand/collapse (no Framer; Sprint 7). */
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
  const expanded = collapsible ? open : true;

  return (
    <section
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
        aria-expanded={collapsible ? open : undefined}
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
          <span
            className={`shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ease-out ${
              expanded ? 'rotate-180' : 'rotate-0'
            }`}
          >
            <IconChevronDown size={12} />
          </span>
        )}
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2.5 pt-2.5">{children}</div>
        </div>
      </div>
    </section>
  );
}
