'use client';

import { useEffect, useState } from 'react';
import {
  VISITOR_SORT_OPTIONS,
  getStoredVisitorSort,
  setStoredVisitorSort,
  type VisitorSortOption,
} from '@/lib/catalog/sort-products';
import { cn } from '@/lib/utils';

interface ProductSortControlProps {
  value?: VisitorSortOption;
  onChange: (sort: VisitorSortOption) => void;
  className?: string;
}

export default function ProductSortControl({ value, onChange, className }: ProductSortControlProps) {
  const [internal, setInternal] = useState<VisitorSortOption>(value ?? 'owner');

  useEffect(() => {
    if (value !== undefined) {
      setInternal(value);
      return;
    }
    setInternal(getStoredVisitorSort());
  }, [value]);

  const handleChange = (next: VisitorSortOption) => {
    setInternal(next);
    setStoredVisitorSort(next);
    onChange(next);
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <label htmlFor="catalog-sort" className="text-xs font-medium text-slate-500 shrink-0">
        Ordenar:
      </label>
      <select
        id="catalog-sort"
        value={internal}
        onChange={(e) => handleChange(e.target.value as VisitorSortOption)}
        className="text-xs font-medium rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/30"
        aria-label="Ordenar productos"
      >
        {VISITOR_SORT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
