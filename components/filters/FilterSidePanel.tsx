'use client';

import React from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState, countActiveFilters } from '@/lib/filters/types';
import { clearFilterChip, getActiveFilterChips } from '@/lib/filters/active-chips';
import FilterControlFields from './FilterControlFields';
import { IconChevronLeft, IconClose, IconFilterFunnel } from '@/components/Icons';

interface FilterSidePanelProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  adisos: Adiso[];
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
const EXPANDED_WIDTH = 300;
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
  collapsed,
  onToggleCollapse,
  onOpenUbicacion,
  userLat,
  userLng,
  resultCount,
}: FilterSidePanelProps) {
  const activeCount = countActiveFilters(filters, categoria);
  const activeChips = getActiveFilterChips(filters, categoria);

  if (collapsed) {
    return (
      <aside className="mx-1 mt-2" style={{ ...stickyStyle, width: COLLAPSED_WIDTH }}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] shadow-sm transition-colors hover:border-[rgba(var(--brand-primary-rgb),0.4)] hover:bg-[var(--hover-bg)] hover:text-[var(--brand-blue)]"
          title="Abrir filtros"
          aria-label="Abrir panel de filtros"
        >
          <IconFilterFunnel size={18} />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--brand-blue)] px-1 text-[9px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="mx-1 mt-2 flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm"
      style={{ ...stickyStyle, width: EXPANDED_WIDTH }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/95 px-3.5 py-3 backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-sm font-bold text-[var(--text-primary)]">Refinar búsqueda</h2>
              {activeCount > 0 && (
                <span className="rounded-full bg-[var(--brand-blue)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </div>
            <p className="m-0 mt-0.5 text-[10px] leading-snug text-[var(--text-tertiary)]">
              Dónde → Tipo → Presupuesto → Calidad
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
            title="Minimizar"
            aria-label="Minimizar panel"
          >
            <IconChevronLeft size={16} />
          </button>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {activeChips.map((chip) => (
              <button
                key={`${chip.id}-${chip.label}`}
                type="button"
                onClick={() => onChange(clearFilterChip(filters, chip.id))}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-[rgba(var(--brand-primary-rgb),0.25)] bg-[rgba(var(--brand-primary-rgb),0.06)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-blue)]"
              >
                <span className="truncate">{chip.label}</span>
                <IconClose size={8} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => onChange({ facets: {} })}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-3">
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

      {/* Footer */}
      <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-3.5 py-2.5">
        <p className="m-0 text-xs font-bold text-[var(--text-primary)]">
          {resultCount} resultado{resultCount === 1 ? '' : 's'}
        </p>
        <p className="m-0 mt-0.5 text-[10px] text-[var(--text-tertiary)]">
          Los filtros se aplican al instante
        </p>
      </div>
    </aside>
  );
}
