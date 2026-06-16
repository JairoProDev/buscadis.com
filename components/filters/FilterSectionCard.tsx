'use client';

import React from 'react';

interface FilterSectionCardProps {
  step: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

export default function FilterSectionCard({
  step,
  title,
  icon,
  children,
  active,
}: FilterSectionCardProps) {
  return (
    <section
      className={`rounded-2xl border p-3 transition-colors ${
        active
          ? 'border-[rgba(var(--brand-primary-rgb),0.35)] bg-[rgba(var(--brand-primary-rgb),0.04)]'
          : 'border-[var(--border-color)] bg-[var(--bg-primary)]/80'
      }`}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
            active
              ? 'bg-[var(--brand-blue)] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
          }`}
        >
          {step}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--brand-blue)]">
          {icon}
        </span>
        <h3 className="m-0 text-xs font-bold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="space-y-2.5 pl-0.5">{children}</div>
    </section>
  );
}
