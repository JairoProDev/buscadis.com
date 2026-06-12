'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Adiso, Categoria } from '@/types';
import { applyBrowseFilters } from '@/lib/filters/apply';
import { BrowseFilterState, FilterLayoutMode, countActiveFilters, DEFAULT_BROWSE_FILTERS } from '@/lib/filters/types';
import { buildFilterChips, removeFilterChip } from '@/lib/filters/labels';
import FilterChipRow from './FilterChipRow';
import FilterControlFields from './FilterControlFields';
import { IconClose, IconFilter } from '@/components/Icons';

const LAYOUT_KEY = 'buscadis_filter_layout';

interface BrowseFiltersProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (filters: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  resultCount: number;
  isDesktop: boolean;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
}

export default function BrowseFilters({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  resultCount,
  isDesktop,
  onOpenUbicacion,
  userLat,
  userLng,
}: BrowseFiltersProps) {
  const [layoutMode, setLayoutMode] = useState<FilterLayoutMode>('inline');
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDraft, setMobileDraft] = useState<BrowseFilterState>(filters);
  const [mobilePreview, setMobilePreview] = useState(resultCount);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeCount = countActiveFilters(filters, categoria);
  const chips = buildFilterChips(filters, categoria);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY) as FilterLayoutMode | null;
      if (saved === 'inline' || saved === 'panel') setLayoutMode(saved);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (mobileOpen) setMobileDraft(filters);
  }, [mobileOpen, filters]);

  useEffect(() => {
    if (!mobileOpen) return;
    const t = setTimeout(() => {
      setMobilePreview(
        applyBrowseFilters({
          adisos,
          categoria,
          busqueda,
          filters: mobileDraft,
          ordenamiento: 'recientes',
          userLat,
          userLng,
        }).length,
      );
    }, 200);
    return () => clearTimeout(t);
  }, [mobileOpen, mobileDraft, adisos, categoria, busqueda, userLat, userLng]);

  useEffect(() => {
    if (!panelOpen || !isDesktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [panelOpen, isDesktop]);

  const toggleLayout = () => {
    const next: FilterLayoutMode = layoutMode === 'inline' ? 'panel' : 'inline';
    setLayoutMode(next);
    try { localStorage.setItem(LAYOUT_KEY, next); } catch { /* ignore */ }
    if (next === 'panel') setPanelOpen(true);
  };

  const showCategoryFilters = categoria !== 'todos';

  const controlProps = {
    categoria,
    filters: isDesktop ? filters : mobileDraft,
    onChange: isDesktop ? onChange : setMobileDraft,
    adisos,
    busqueda,
    userLat,
    userLng,
    onOpenUbicacion,
  };

  return (
    <div className="pb-2">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {isDesktop ? (
          <>
            <button
              type="button"
              onClick={() => layoutMode === 'panel' ? setPanelOpen((o) => !o) : undefined}
              onMouseEnter={() => layoutMode === 'panel' && setPanelOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border border-[var(--brand-yellow)] bg-[rgba(var(--brand-yellow-rgb),0.1)] text-[var(--text-primary)] min-h-[40px]"
            >
              <IconFilter size={16} />
              Filtros
              {activeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[var(--brand-blue)] text-white text-xs font-bold">
                  {activeCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={toggleLayout}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--brand-blue)] px-2 py-1 rounded-lg hover:bg-[var(--hover-bg)]"
              title={layoutMode === 'inline' ? 'Usar panel flotante' : 'Mostrar en línea'}
            >
              {layoutMode === 'inline' ? 'Panel lateral' : 'En línea'}
            </button>
            <span className="text-xs text-[var(--text-tertiary)] ml-auto">
              {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
            </span>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border border-[var(--brand-yellow)] bg-[rgba(var(--brand-yellow-rgb),0.12)] text-[var(--text-primary)] min-h-[44px] flex-1 justify-center"
          >
            <IconFilter size={18} />
            Filtros
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--brand-blue)] text-white text-xs font-bold">
                {activeCount}
              </span>
            )}
          </button>
        )}
      </div>

      <FilterChipRow
        chips={chips}
        onRemove={(chip) => onChange(removeFilterChip(filters, chip))}
        onClearAll={() => onChange({ ...DEFAULT_BROWSE_FILTERS, facets: {} })}
        showClearAll={chips.length > 1}
      />

      {!showCategoryFilters && (
        <p className="text-xs text-[var(--text-tertiary)] px-1 mb-2">
          Elige una categoría para filtros específicos (empleo, inmueble, etc.)
        </p>
      )}

      {isDesktop && layoutMode === 'inline' && (
        <div
          className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/80 p-4 mb-2"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <FilterControlFields {...controlProps} />
        </div>
      )}

      {isDesktop && layoutMode === 'panel' && panelOpen && (
        <div
          className="fixed inset-0 z-[850] pointer-events-none"
          aria-hidden={!panelOpen}
        >
          <div
            ref={panelRef}
            className="pointer-events-auto absolute left-0 top-[72px] bottom-0 w-[min(300px,88vw)] overflow-y-auto border-r border-[var(--border-color)] p-4"
            style={{
              background: 'rgba(var(--brand-primary-rgb), 0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
            }}
            onMouseLeave={() => setPanelOpen(false)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Filtros</h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--hover-bg)]"
                aria-label="Cerrar panel"
              >
                <IconClose size={16} />
              </button>
            </div>
            <FilterControlFields {...controlProps} compact />
            <div className="mt-4 pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
              {resultCount} {resultCount === 1 ? 'anuncio' : 'anuncios'}
            </div>
          </div>
        </div>
      )}

      {!isDesktop && mobileOpen && (
        <div className="fixed inset-0 z-[1100] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Filtros">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative bg-[var(--bg-primary)] rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Filtros</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--hover-bg)] min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <IconClose size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-4">
              <FilterControlFields
                {...controlProps}
                filters={mobileDraft}
                onChange={setMobileDraft}
                compact
              />
            </div>
            <div className="flex gap-3 p-4 border-t border-[var(--border-color)] flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMobileDraft({ ...DEFAULT_BROWSE_FILTERS, facets: {} });
                }}
                className="flex-1 py-3 rounded-xl border border-[var(--border-color)] font-semibold text-[var(--text-secondary)] min-h-[48px]"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(mobileDraft);
                  setMobileOpen(false);
                }}
                className="flex-[2] py-3 rounded-xl font-bold text-white min-h-[48px]"
                style={{ backgroundColor: 'var(--brand-blue)' }}
              >
                Ver {mobilePreview} {mobilePreview === 1 ? 'anuncio' : 'anuncios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
