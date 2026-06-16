'use client';

import React from 'react';
import { BrowseFilterState } from '@/lib/filters/types';

const RADIUS_OPTIONS = [2, 5, 10, 20, 50] as const;

interface FilterRadiusControlProps {
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  enabled: boolean;
}

export default function FilterRadiusControl({ filters, onChange, enabled }: FilterRadiusControlProps) {
  if (!enabled || !filters.ubicacion) return null;

  const current = filters.ubicacion.radioKm ?? 5;

  return (
    <div className="space-y-1.5 pt-1">
      <p className="m-0 text-[10px] font-medium text-[var(--text-secondary)]">Radio de búsqueda</p>
      <div className="flex flex-wrap gap-1">
        {RADIUS_OPTIONS.map((km) => {
          const active = current === km;
          return (
            <button
              key={km}
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  ubicacion: { ...filters.ubicacion!, radioKm: km },
                })
              }
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
                active
                  ? 'bg-[var(--brand-blue)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              {km} km
            </button>
          );
        })}
      </div>
    </div>
  );
}
