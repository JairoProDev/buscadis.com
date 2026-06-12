'use client';

import React from 'react';
import { Categoria } from '@/types';
import { BrowseFilterState, FilterDefinition } from '@/lib/filters/types';
import { getFiltersForCategory } from '@/lib/filters/definitions';
import { countFacetOption } from '@/lib/filters/apply';
import { Adiso } from '@/types';

interface FilterControlFieldsProps {
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  onChange: (next: BrowseFilterState) => void;
  adisos: Adiso[];
  busqueda: string;
  userLat?: number;
  userLng?: number;
  onOpenUbicacion?: () => void;
  compact?: boolean;
}

function groupFilters(defs: FilterDefinition[]): Record<string, FilterDefinition[]> {
  const groups: Record<string, FilterDefinition[]> = {};
  defs.forEach((d) => {
    const g = d.group ?? 'General';
    if (!groups[g]) groups[g] = [];
    groups[g].push(d);
  });
  return groups;
}

export default function FilterControlFields({
  categoria,
  filters,
  onChange,
  adisos,
  busqueda,
  userLat,
  userLng,
  onOpenUbicacion,
  compact,
}: FilterControlFieldsProps) {
  const defs = getFiltersForCategory(categoria);
  const groups = groupFilters(defs);

  const setFacet = (id: string, value: string | string[] | boolean | undefined) => {
    const facets = { ...filters.facets };
    if (value === undefined || value === false || (Array.isArray(value) && value.length === 0)) {
      delete facets[id];
    } else {
      facets[id] = value;
    }
    onChange({ ...filters, facets });
  };

  const toggleChip = (id: string, value: string, multi = false) => {
    const current = filters.facets[id];
    if (multi) {
      const arr = Array.isArray(current) ? [...current] : current ? [String(current)] : [];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      setFacet(id, arr.length ? arr : undefined);
    } else {
      setFacet(id, current === value ? undefined : value);
    }
  };

  const labelClass = compact ? 'text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block' : 'text-sm font-semibold text-[var(--text-primary)] mb-2 block';

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {Object.entries(groups).map(([groupName, groupDefs]) => (
        <section key={groupName}>
          {!compact && (
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-3">
              {groupName}
            </h3>
          )}
          <div className={compact ? 'space-y-3' : 'space-y-4'}>
            {groupDefs.map((def) => {
              if (def.type === 'price-range') {
                const hasMin = filters.precioMin != null && filters.precioMin > 0;
                const hasMax = filters.precioMax != null && filters.precioMax > 0;
                return (
                  <div key={def.id}>
                    <label className={`${labelClass} ${hasMin || hasMax ? 'text-[var(--brand-blue)] font-bold' : ''}`}>
                      {def.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        placeholder="Mín"
                        value={filters.precioMin ?? ''}
                        onChange={(e) => {
                          const v = e.target.value ? Number(e.target.value) : undefined;
                          onChange({ ...filters, precioMin: v && v > 0 ? v : undefined });
                        }}
                        className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-[var(--text-primary)] text-sm transition-all ${
                          hasMin
                            ? 'border-[var(--brand-blue)] bg-blue-50/10 dark:bg-blue-950/10 shadow-sm'
                            : 'border-[var(--border-color)] bg-[var(--bg-primary)]'
                        }`}
                      />
                      <span className="text-[var(--text-tertiary)]">—</span>
                      <input
                        type="number"
                        min={0}
                        placeholder="Máx"
                        value={filters.precioMax ?? ''}
                        onChange={(e) => {
                          const v = e.target.value ? Number(e.target.value) : undefined;
                          onChange({ ...filters, precioMax: v && v > 0 ? v : undefined });
                        }}
                        className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-[var(--text-primary)] text-sm transition-all ${
                          hasMax
                            ? 'border-[var(--brand-blue)] bg-blue-50/10 dark:bg-blue-950/10 shadow-sm'
                            : 'border-[var(--border-color)] bg-[var(--bg-primary)]'
                        }`}
                      />
                    </div>
                  </div>
                );
              }

              if (def.type === 'toggle') {
                const boolKeys = ['soloConPrecio', 'conFotos', 'verificado', 'destacado', 'incluirMasAnuncios'] as const;
                const isFacetToggle = !boolKeys.includes(def.id as typeof boolKeys[number]);
                const checked = isFacetToggle
                  ? filters.facets[def.id] === true
                  : Boolean(filters[def.id as keyof BrowseFilterState]);

                return (
                  <label
                    key={def.id}
                    className="flex items-center justify-between gap-3 py-1 cursor-pointer min-h-[44px]"
                  >
                    <span className={`text-sm transition-colors ${checked ? 'text-[var(--brand-blue)] font-semibold' : 'text-[var(--text-primary)]'}`}>{def.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={checked}
                      onClick={() => {
                        if (isFacetToggle) {
                          setFacet(def.id, checked ? undefined : true);
                        } else {
                          const key = def.id as keyof BrowseFilterState;
                          onChange({ ...filters, [key]: checked ? undefined : true });
                        }
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        checked ? 'bg-[var(--brand-blue)]' : 'bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          checked ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </label>
                );
              }

              if (def.type === 'select' && def.options) {
                const hasSelect = Boolean(filters.publicadoEn);
                return (
                  <div key={def.id}>
                    <label className={`${labelClass} ${hasSelect ? 'text-[var(--brand-blue)] font-bold' : ''}`}>{def.label}</label>
                    <select
                      value={(filters.publicadoEn as string) ?? ''}
                      onChange={(e) => {
                        const v = e.target.value as BrowseFilterState['publicadoEn'];
                        onChange({ ...filters, publicadoEn: v || undefined });
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        hasSelect
                          ? 'border-[var(--brand-blue)] bg-blue-50/10 dark:bg-blue-950/10 text-[var(--brand-blue)] font-semibold shadow-sm'
                          : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]'
                      }`}
                    >
                      <option value="">Cualquier fecha</option>
                      {def.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (def.type === 'ubicacion') {
                const u = filters.ubicacion;
                const hasUbi = Boolean(u?.distrito || u?.provincia || u?.departamento);
                const label = u?.distrito || u?.provincia || u?.departamento || 'Elegir ubicación';
                return (
                  <div key={def.id}>
                    <label className={`${labelClass} ${hasUbi ? 'text-[var(--brand-blue)] font-bold' : ''}`}>{def.label}</label>
                    <button
                      type="button"
                      onClick={onOpenUbicacion}
                      className={`w-full px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
                        hasUbi
                          ? 'border-[var(--brand-blue)] bg-blue-50/10 dark:bg-blue-950/10 text-[var(--brand-blue)] font-semibold shadow-sm'
                          : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--brand-blue)]/50'
                      }`}
                    >
                      {label}
                    </button>
                  </div>
                );
              }

              if (def.type === 'chips' && def.options) {
                const current = filters.facets[def.id];
                return (
                  <div key={def.id}>
                    <label className={labelClass}>{def.label}</label>
                    <div className="flex flex-wrap gap-2">
                      {def.options.map((opt) => {
                        const selected = Array.isArray(current)
                          ? current.includes(opt.value)
                          : current === opt.value;
                        const count = categoria !== 'todos'
                          ? countFacetOption(adisos, categoria, busqueda, filters, def.id, opt.value, userLat, userLng)
                          : undefined;
                        const disabled = count === 0;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleChip(def.id, opt.value, false)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all min-h-[36px] ${
                              selected
                                ? 'bg-[var(--brand-blue)] text-white border-[var(--brand-blue)]'
                                : disabled
                                  ? 'opacity-40 cursor-not-allowed border-[var(--border-color)] text-[var(--text-tertiary)]'
                                  : 'border-[var(--brand-yellow)] text-[var(--text-primary)] hover:bg-[rgba(var(--brand-yellow-rgb),0.1)]'
                            }`}
                          >
                            {opt.label}
                            {count != null && count > 0 && (
                              <span className="ml-1 opacity-75">({count})</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
