'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState } from '@/lib/filters/types';
import { getFiltersForCategory, getFilterDefinition } from '@/lib/filters/definitions';
import { clearInlineFilter, getInlineFilterButtons } from '@/lib/filters/inline-display';
import { countFacetOption } from '@/lib/filters/apply';
import { IconChevronDown, IconClose } from '@/components/Icons';

const pillClass =
  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 min-h-[32px] transition-all duration-200';

interface FilterInlineSelectorsProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  onOpenUbicacion?: () => void;
  userLat?: number;
  userLng?: number;
}

export default function FilterInlineSelectors({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  onOpenUbicacion,
  userLat,
  userLng,
}: FilterInlineSelectorsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [openAnchor, setOpenAnchor] = useState<HTMLElement | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const rowRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideRow = rowRef.current && rowRef.current.contains(target);
      const clickedInsidePopover = popoverRef.current && popoverRef.current.contains(target);
      if (!clickedInsideRow && !clickedInsidePopover) {
        setOpenId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [openId]);

  useEffect(() => {
    if (!openId || !openAnchor) return;
    const updatePosition = () => {
      const rect = openAnchor.getBoundingClientRect();
      const popoverWidth = 240; // Estimated maximum width
      let left = rect.left;
      
      // Prevent running off the right side of the screen
      if (left + popoverWidth > window.innerWidth) {
        left = Math.max(8, window.innerWidth - popoverWidth - 16);
      }
      left = Math.max(8, left);

      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: left + window.scrollX,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true); // Capture phase handles inner containers scrolling
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [openId, openAnchor]);

  const buttons = getInlineFilterButtons(categoria, filters);

  const renderPopover = (buttonId: string) => {
    const def = getFilterDefinition(buttonId, categoria)
      ?? getFiltersForCategory(categoria).find((d) => d.id === buttonId);

    if (buttonId === 'precio') {
      return (
        <div className="p-3 space-y-2 w-[220px]">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Mín"
              defaultValue={filters.precioMin ?? ''}
              id="precio-min-input"
              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
            />
            <span className="text-[var(--text-tertiary)]">—</span>
            <input
              type="number"
              min={0}
              placeholder="Máx"
              defaultValue={filters.precioMax ?? ''}
              id="precio-max-input"
              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm"
            />
          </div>
          <button
            type="button"
            className="w-full py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: 'var(--brand-blue)' }}
            onClick={() => {
              const minEl = document.getElementById('precio-min-input') as HTMLInputElement;
              const maxEl = document.getElementById('precio-max-input') as HTMLInputElement;
              const min = minEl?.value ? Number(minEl.value) : undefined;
              const max = maxEl?.value ? Number(maxEl.value) : undefined;
              onChange({
                ...filters,
                precioMin: min && min > 0 ? min : undefined,
                precioMax: max && max > 0 ? max : undefined,
              });
              setOpenId(null);
            }}
          >
            Aplicar
          </button>
        </div>
      );
    }

    if (buttonId === 'publicadoEn' && def?.options) {
      return (
        <ul className="py-1 min-w-[200px]">
          <li>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)]"
              onClick={() => {
                onChange({ ...filters, publicadoEn: undefined });
                setOpenId(null);
              }}
            >
              Cualquier fecha
            </button>
          </li>
          {def.options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] ${
                  filters.publicadoEn === opt.value ? 'text-[var(--brand-blue)] font-semibold' : ''
                }`}
                onClick={() => {
                  onChange({ ...filters, publicadoEn: opt.value as BrowseFilterState['publicadoEn'] });
                  setOpenId(null);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      );
    }

    const facetId = def?.id ?? buttonId;
    if (def?.type === 'chips' && def.options) {
      return (
        <ul className="py-1 min-w-[200px]">
          {def.options.map((opt) => {
            const count = categoria !== 'todos'
              ? countFacetOption(adisos, categoria, busqueda, filters, facetId, opt.value, userLat, userLng)
              : undefined;
            const disabled = count === 0;
            const selected = filters.facets[facetId] === opt.value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  disabled={disabled}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg)] disabled:opacity-40 ${
                    selected ? 'text-[var(--brand-blue)] font-semibold' : ''
                  }`}
                  onClick={() => {
                    const facets = { ...filters.facets };
                    if (selected) delete facets[facetId];
                    else facets[facetId] = opt.value;
                    onChange({ ...filters, facets });
                    setOpenId(null);
                  }}
                >
                  {opt.label}
                  {count != null && count > 0 && (
                    <span className="ml-1 opacity-60">({count})</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      );
    }

    if (def?.type === 'toggle' || ['soloConPrecio', 'conFotos', 'verificado', 'destacado', 'incluirMasAnuncios'].includes(buttonId)) {
      const isFacet = Boolean(def?.requiresCategory);
      const active = isFacet
        ? filters.facets[facetId] === true
        : Boolean(filters[buttonId as keyof BrowseFilterState]);

      return (
        <div className="p-1 min-w-[180px]">
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--hover-bg)]"
            onClick={() => {
              if (isFacet) {
                const facets = { ...filters.facets };
                if (active) delete facets[facetId];
                else facets[facetId] = true;
                onChange({ ...filters, facets });
              } else {
                onChange({ ...filters, [buttonId]: active ? undefined : true });
              }
              setOpenId(null);
            }}
          >
            {active ? '✓ Activado — tocar para quitar' : 'Activar'}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div ref={rowRef} className="relative mb-2">
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {buttons.map((btn) => {
          const isOpen = openId === btn.id;
          const displayText = btn.isActive && btn.activeLabel ? btn.activeLabel : btn.label;

          return (
            <div key={btn.id} className="relative flex-shrink-0">
              <div
                className={`${pillClass} ${
                  btn.isActive
                    ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--brand-blue)]/50'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    if (btn.type === 'ubicacion') {
                      onOpenUbicacion?.();
                      return;
                    }
                    setOpenAnchor(e.currentTarget);
                    setOpenId(isOpen ? null : btn.id);
                  }}
                  className={`inline-flex items-center gap-1.5 font-semibold text-xs transition-colors active:scale-95 duration-150 ${
                    btn.isActive ? 'text-white' : 'text-[var(--text-primary)]'
                  }`}
                >
                  <span className="max-w-[140px] truncate">{displayText}</span>
                  {btn.type !== 'ubicacion' && (
                    <IconChevronDown
                      size={10}
                      className={`flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      } ${btn.isActive ? 'text-white' : 'opacity-60'}`}
                    />
                  )}
                </button>
                {btn.isActive && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(clearInlineFilter(filters, btn.id, btn.facetId));
                      if (openId === btn.id) setOpenId(null);
                    }}
                    className="ml-1 p-0.5 rounded-full hover:bg-white/20 text-white inline-flex items-center justify-center transition-colors"
                    aria-label={`Quitar ${btn.label}`}
                  >
                    <IconClose size={10} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Render Popover outside overflow-hidden row via Portal */}
      {mounted && openId && openAnchor && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[9999] rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-2xl p-1 animate-in fade-in slide-in-from-top-1 duration-150"
          style={{
            top: coords.top,
            left: coords.left,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1), 0 0 0 1px var(--border-color)',
          }}
        >
          {renderPopover(openId)}
        </div>,
        document.body
      )}
    </div>
  );
}

