'use client';

import React, { useEffect } from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState } from '@/lib/filters/types';
import FilterControlFields from './FilterControlFields';
import { IconChevronLeft, IconChevronRight } from '@/components/Icons';

interface FilterSidePanelProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
  resultCount: number;
}

const COLLAPSED_WIDTH = 44;
const EXPANDED_WIDTH = 280;

export default function FilterSidePanel({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  collapsed,
  onToggleCollapse,
  onOpenUbicacion,
  userLat,
  userLng,
  resultCount,
}: FilterSidePanelProps) {
  useEffect(() => {
    const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
    document.documentElement.style.setProperty('--left-sidebar-width', `${width}px`);
    return () => {
      document.documentElement.style.setProperty('--left-sidebar-width', '0px');
    };
  }, [collapsed]);

  if (collapsed) {
    return (
      <aside
        className="flex-shrink-0 sticky top-[72px] self-start bg-[var(--bg-primary)] rounded-2xl shadow-sm my-2"
        style={{ width: COLLAPSED_WIDTH, minHeight: 120 }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full h-full py-4 flex flex-col items-center gap-2 rounded-2xl text-[var(--text-secondary)] hover:text-[var(--brand-blue)] hover:bg-[var(--hover-bg)] transition-colors"
          title="Abrir filtros"
          aria-label="Abrir panel de filtros"
        >
          <IconChevronRight size={18} />
          <span
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Filtros
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="flex-shrink-0 sticky top-[72px] self-start bg-[var(--bg-primary)] overflow-y-auto rounded-2xl shadow-sm my-2 no-scrollbar"
      style={{
        width: EXPANDED_WIDTH,
        maxHeight: 'calc(100vh - 72px - 1rem)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-[var(--bg-primary)] z-10">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">Filtros</h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors"
          title="Minimizar"
          aria-label="Minimizar panel"
        >
          <IconChevronLeft size={16} />
        </button>
      </div>
      <div className="px-4 pb-4">
        <FilterControlFields
          categoria={categoria}
          filters={filters}
          onChange={onChange}
          adisos={adisos}
          busqueda={busqueda}
          userLat={userLat}
          userLng={userLng}
          onOpenUbicacion={onOpenUbicacion}
          compact
        />
      </div>
      <div className="px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-b-2xl">
        {resultCount} resultado{resultCount === 1 ? '' : 's'}
      </div>
    </aside>
  );
}
