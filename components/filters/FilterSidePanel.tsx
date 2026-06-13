'use client';

import React, { useEffect } from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState } from '@/lib/filters/types';
import FilterControlFields from './FilterControlFields';
import Buscador from '@/components/Buscador';
import { IconChevronLeft, IconChevronRight } from '@/components/Icons';

interface FilterSidePanelProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  searchValue: string;
  onBusquedaChange: (value: string) => void;
  onCategoryDetected?: (categoria: Categoria) => void;
  onNotify?: (message: string, type?: 'info' | 'error' | 'success') => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
  resultCount: number;
}

const COLLAPSED_WIDTH = 44;
const EXPANDED_WIDTH = 280;
const SIDE_GAP = 8;
const HEADER_VAR = 'var(--header-height, 72px)';

export default function FilterSidePanel({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  searchValue,
  onBusquedaChange,
  onCategoryDetected,
  onNotify,
  collapsed,
  onToggleCollapse,
  onOpenUbicacion,
  userLat,
  userLng,
  resultCount,
}: FilterSidePanelProps) {
  useEffect(() => {
    const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
    document.documentElement.style.setProperty('--left-sidebar-width', `${width + SIDE_GAP * 2}px`);
    return () => {
      document.documentElement.style.setProperty('--left-sidebar-width', '0px');
    };
  }, [collapsed]);

  const sharedStyle: React.CSSProperties = {
    position: 'fixed',
    left: SIDE_GAP,
    top: `calc(${HEADER_VAR} + ${SIDE_GAP}px)`,
    height: `calc(100vh - ${HEADER_VAR} - ${SIDE_GAP * 2}px)`,
    zIndex: 500,
    transition: 'top 0.35s ease, height 0.35s ease',
  };

  if (collapsed) {
    return (
      <aside
        className="bg-[var(--bg-primary)] rounded-2xl shadow-sm"
        style={{ ...sharedStyle, width: COLLAPSED_WIDTH }}
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
      className="bg-[var(--bg-primary)] overflow-y-auto rounded-2xl shadow-sm no-scrollbar flex flex-col"
      style={{ ...sharedStyle, width: EXPANDED_WIDTH }}
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
        <div className="mb-3">
          <Buscador
            value={searchValue}
            onChange={onBusquedaChange}
            compact
            onCategoryDetected={onCategoryDetected}
            onNotify={onNotify}
          />
        </div>
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
      <div className="px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-b-2xl mt-auto">
        {resultCount} resultado{resultCount === 1 ? '' : 's'}
      </div>
    </aside>
  );
}
