'use client';

import React from 'react';
import { Categoria } from '@/types';
import { BrowseFilterState, FilterDefinition } from '@/lib/filters/types';
import { getFiltersForCategory } from '@/lib/filters/definitions';
import { countFacetOption } from '@/lib/filters/apply';
import { Adiso } from '@/types';
import { TriStateSegment, ToggleCheck, FilterSelect } from './FilterUI';

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

const UNIVERSAL_GROUPS = ['General', 'Confianza', 'Ubicación'];

function groupFilters(defs: FilterDefinition[]): Record<string, FilterDefinition[]> {
  const groups: Record<string, FilterDefinition[]> = {};
  defs.forEach((d) => {
    const g = d.group ?? 'General';
    if (!groups[g]) groups[g] = [];
    groups[g].push(d);
  });
  return groups;
}

/** Ordena grupos: filtros específicos de la categoría primero, luego generales */
function orderGroups(groups: Record<string, FilterDefinition[]>): [string, FilterDefinition[]][] {
  const entries = Object.entries(groups);
  return entries.sort(([a], [b]) => {
    const aUniversal = UNIVERSAL_GROUPS.includes(a);
    const bUniversal = UNIVERSAL_GROUPS.includes(b);
    if (aUniversal === bUniversal) return 0;
    return aUniversal ? 1 : -1;
  });
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
  const groups = orderGroups(groupFilters(defs));

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
      {groups.map(([groupName, groupDefs]) => {
        const isCategoryGroup = !UNIVERSAL_GROUPS.includes(groupName);
        return (
          <section
            key={groupName}
            className={isCategoryGroup ? 'rounded-2xl bg-[var(--hover-bg)] p-3 -mx-1' : undefined}
          >
            {!compact && (
              <h3 className={`text-[11px] font-bold uppercase tracking-wide mb-3 ${
                isCategoryGroup ? 'text-[var(--brand-blue)]' : 'text-[var(--text-tertiary)]'
              }`}>
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
                          className={`flex-1 min-w-0 px-3 py-2 rounded-xl text-[var(--text-primary)] text-sm transition-all ${
                            hasMin
                              ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)] font-semibold shadow-sm'
                              : 'bg-[var(--bg-tertiary)]'
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
                          className={`flex-1 min-w-0 px-3 py-2 rounded-xl text-[var(--text-primary)] text-sm transition-all ${
                            hasMax
                              ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)] font-semibold shadow-sm'
                              : 'bg-[var(--bg-tertiary)]'
                          }`}
                        />
                      </div>
                    </div>
                  );
                }

                if (def.type === 'tri-toggle') {
                  const value = filters[def.id as keyof BrowseFilterState] as boolean | undefined;
                  const labels = (def.options
                    ? ['Todos', def.options[0]?.label ?? 'Con', def.options[1]?.label ?? 'Sin']
                    : ['Todos', 'Con', 'Sin']) as [string, string, string];
                  return (
                    <TriStateSegment
                      key={def.id}
                      label={def.label}
                      value={value}
                      onChange={(v) => onChange({ ...filters, [def.id]: v })}
                      labels={labels}
                    />
                  );
                }

                if (def.type === 'toggle') {
                  const isFacetToggle = Boolean(def.requiresCategory);
                  const checked = isFacetToggle
                    ? filters.facets[def.id] === true
                    : Boolean(filters[def.id as keyof BrowseFilterState]);

                  return (
                    <ToggleCheck
                      key={def.id}
                      label={def.label}
                      checked={checked}
                      onToggle={() => {
                        if (isFacetToggle) {
                          setFacet(def.id, checked ? undefined : true);
                        } else {
                          const key = def.id as keyof BrowseFilterState;
                          onChange({ ...filters, [key]: checked ? undefined : true });
                        }
                      }}
                    />
                  );
                }

                if (def.type === 'select' && def.options) {
                  const hasSelect = Boolean(filters.publicadoEn);
                  return (
                    <div key={def.id}>
                      <label className={`${labelClass} ${hasSelect ? 'text-[var(--brand-blue)] font-bold' : ''}`}>{def.label}</label>
                      <FilterSelect
                        value={filters.publicadoEn}
                        placeholder="Cualquier fecha"
                        options={def.options}
                        onChange={(v) => onChange({ ...filters, publicadoEn: v as BrowseFilterState['publicadoEn'] })}
                      />
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
                        className={`w-full px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                          hasUbi
                            ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)] font-semibold shadow-sm'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
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
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] ${
                                selected
                                  ? 'bg-[var(--brand-blue)] text-white'
                                  : disabled
                                    ? 'opacity-40 cursor-not-allowed bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
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
        );
      })}
    </div>
  );
}
