'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState, countActiveFilters } from '@/lib/filters/types';
import { clearFilterChip, getActiveFilterChips } from '@/lib/filters/active-chips';
import { buildFilterInsight, getSectionCompletion } from '@/lib/filters/panel-meta';
import { TipoOrdenamiento } from '@/components/Ordenamiento';
import FilterControlFields from './FilterControlFields';
import FilterProgressSteps from './FilterProgressSteps';
import FilterSortPanel from './FilterSortPanel';
import FilterSavedPresets, { FilterShareLink } from './FilterSavedPresets';
import FilterPanelFooter from './FilterPanelFooter';
import { IconChevronLeft, IconClose, IconFilterFunnel } from '@/components/Icons';

interface FilterSidePanelProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  adisos: Adiso[];
  committedQuery?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
  resultCount: number;
  totalPool: number;
  ordenamiento: TipoOrdenamiento;
  onSortChange: (sort: TipoOrdenamiento) => void;
}

const COLLAPSED_WIDTH = 40;
const EXPANDED_WIDTH = 308;
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
  totalPool,
  ordenamiento,
  onSortChange,
}: FilterSidePanelProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const activeCount = countActiveFilters(filters, categoria);
  const activeChips = getActiveFilterChips(filters, categoria);
  const sections = useMemo(() => getSectionCompletion(filters, categoria), [filters, categoria]);
  const insight = useMemo(
    () => buildFilterInsight(filters, categoria, resultCount, totalPool),
    [filters, categoria, resultCount, totalPool],
  );

  const scrollToSection = (sectionId: string) => {
    document.getElementById(`filter-section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (collapsed) {
    return (
      <aside className="mx-1 mt-2" style={{ ...stickyStyle, width: COLLAPSED_WIDTH }}>
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onToggleCollapse}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] shadow-sm transition-colors hover:border-[rgba(var(--brand-primary-rgb),0.4)] hover:text-[var(--brand-blue)]"
          title="Abrir filtros"
          aria-label="Abrir panel de filtros"
        >
          <IconFilterFunnel size={18} />
          {activeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--brand-blue)] px-1 text-[9px] font-bold text-white"
            >
              {activeCount}
            </motion.span>
          )}
        </motion.button>
      </aside>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0.9 }}
      animate={{ opacity: 1 }}
      className="mx-1 mt-2 flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-md"
      style={{ ...stickyStyle, width: EXPANDED_WIDTH }}
    >
      <div className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/95 px-3.5 py-3 backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="m-0 text-sm font-bold text-[var(--text-primary)]">Refinar búsqueda</h2>
              <AnimatePresence>
                {activeCount > 0 && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="rounded-full bg-[var(--brand-blue)] px-1.5 py-0.5 text-[9px] font-bold text-white"
                  >
                    {activeCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <p className="m-0 mt-0.5 text-[10px] leading-snug text-[var(--text-tertiary)]">{insight}</p>
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

        <FilterProgressSteps sections={sections} onJump={scrollToSection} />

        {activeChips.length > 0 && (
          <motion.div
            layout
            className="mt-2.5 flex flex-wrap gap-1"
          >
            {activeChips.map((chip) => (
              <motion.button
                key={`${chip.id}-${chip.label}`}
                layout
                type="button"
                onClick={() => onChange(clearFilterChip(filters, chip.id))}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-[rgba(var(--brand-primary-rgb),0.25)] bg-[rgba(var(--brand-primary-rgb),0.06)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-blue)]"
              >
                <span className="truncate">{chip.label}</span>
                <IconClose size={8} />
              </motion.button>
            ))}
            <button
              type="button"
              onClick={() => onChange({ facets: {} })}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              Limpiar todo
            </button>
          </motion.div>
        )}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <FilterSortPanel value={ordenamiento} onChange={onSortChange} />

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

        <div className="mt-3 space-y-2 border-t border-[var(--border-color)] pt-3">
          <FilterSavedPresets categoria={categoria} filters={filters} onApply={onChange} />
          <FilterShareLink onCopy={copyShareLink} copied={linkCopied} />
        </div>
      </div>

      <FilterPanelFooter resultCount={resultCount} totalPool={totalPool} insight="Se actualiza al instante">
        <p className="m-0 text-[9px] text-[var(--text-tertiary)]">
          Tip: guarda combinaciones que uses seguido
        </p>
      </FilterPanelFooter>
    </motion.aside>
  );
}
