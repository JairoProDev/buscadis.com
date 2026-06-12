'use client';

import React from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState, countActiveFilters } from '@/lib/filters/types';
import FilterInlineSelectors from './FilterInlineSelectors';
import { IconFilterFunnel, IconFilterSliders } from '@/components/Icons';

interface BrowseFiltersProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (filters: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  isDesktop: boolean;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileFilters: () => void;
}

export default function BrowseFilters({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  isDesktop,
  onOpenUbicacion,
  userLat,
  userLng,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileFilters,
}: BrowseFiltersProps) {
  const activeFiltersCount = countActiveFilters(filters, categoria);

  const toggleBtn = (
    <button
      type="button"
      onClick={isDesktop ? onToggleSidebar : onOpenMobileFilters}
      className="flex-shrink-0 flex items-center justify-center w-[36px] h-[36px] rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--brand-blue)]/50 text-[var(--text-primary)] hover:text-[var(--brand-blue)] active:scale-90 transition-all duration-150 relative"
      title="Filtros"
      aria-label="Alternar panel de filtros"
    >
      {isDesktop && !sidebarCollapsed ? (
        <IconFilterSliders size={18} className="transition-all" />
      ) : (
        <IconFilterFunnel size={18} className="transition-all" />
      )}
      {activeFiltersCount > 0 && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--brand-blue)] border-2 border-[var(--bg-primary)] rounded-full animate-pulse" />
      )}
    </button>
  );

  return (
    <div className="pb-1">
      <div className="flex items-center gap-2 min-w-0">
        {toggleBtn}
        <div className="flex-1 min-w-0">
          <FilterInlineSelectors
            categoria={categoria}
            filters={filters}
            onChange={onChange}
            adisos={adisos}
            busqueda={busqueda}
            onOpenUbicacion={onOpenUbicacion}
            userLat={userLat}
            userLng={userLng}
          />
        </div>
      </div>
    </div>
  );
}

