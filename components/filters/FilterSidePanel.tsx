'use client';

import React from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState } from '@/lib/filters/types';
import FilterControlFields from './FilterControlFields';
import PlatformCommandPalette from '@/components/search/PlatformCommandPalette';
import { IconChevronLeft, IconFilterFunnel } from '@/components/Icons';

interface FilterSidePanelProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  adisos: Adiso[];
  /** Debounced committed search query — used only for facet counts when search is active */
  committedQuery?: string;
  onCategorySelect?: (categoria: Categoria) => void;
  onPlatformAction?: (actionId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
  resultCount: number;
}

const COLLAPSED_WIDTH = 40;
const EXPANDED_WIDTH = 280;
const HEADER_VAR = 'var(--header-height, 72px)';

const stickyStyle: React.CSSProperties = {
  position: 'sticky',
  top: `calc(${HEADER_VAR} + 8px)`,
  maxHeight: `calc(100vh - ${HEADER_VAR} - 16px)`,
  alignSelf: 'flex-start',
  flexShrink: 0,
  zIndex: 500,
  transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
};

export default function FilterSidePanel({
  categoria,
  filters,
  onChange,
  adisos,
  committedQuery = '',
  onCategorySelect,
  onPlatformAction,
  collapsed,
  onToggleCollapse,
  onOpenUbicacion,
  userLat,
  userLng,
  resultCount,
}: FilterSidePanelProps) {
  if (collapsed) {
    return (
      <aside
        className="mx-1 mt-2"
        style={{ ...stickyStyle, width: COLLAPSED_WIDTH }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-primary)] shadow-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--brand-blue)] hover:border-[var(--brand-blue)]/40 hover:bg-[var(--hover-bg)] transition-colors"
          title="Abrir filtros"
          aria-label="Abrir panel de filtros"
        >
          <IconFilterFunnel size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="mx-1 mt-2 brand-mesh-glass overflow-y-auto rounded-2xl shadow-sm no-scrollbar flex flex-col"
      style={{ ...stickyStyle, width: EXPANDED_WIDTH }}
    >
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 brand-mesh-glass z-10">
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
        <PlatformCommandPalette
          onSelectCategory={onCategorySelect}
          onAction={(actionId) => {
            if (actionId === 'open_ubicacion') onOpenUbicacion?.();
            onPlatformAction?.(actionId);
          }}
        />
        <FilterControlFields
          categoria={categoria}
          filters={filters}
          onChange={onChange}
          adisos={adisos}
          busqueda={committedQuery}
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
