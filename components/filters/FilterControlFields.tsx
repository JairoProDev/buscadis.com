'use client';

import React from 'react';
import { Adiso, Categoria } from '@/types';
import { BrowseFilterState, FilterDefinition } from '@/lib/filters/types';
import { getFiltersForCategory } from '@/lib/filters/definitions';
import { countFacetOption } from '@/lib/filters/apply';
import { getCategoriaLabel } from '@/lib/categoria-icons';
import {
  IconCalendar,
  IconChevronRight,
  IconImage,
  IconLocation,
  IconMedal,
  IconShield,
  IconTag,
  IconUserCheck,
} from '@/components/Icons';
import FilterSectionCard from './FilterSectionCard';
import FilterRadiusControl from './FilterRadiusControl';
import FilterQuickPresets from './FilterQuickPresets';
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
  showQuickPresets?: boolean;
}

const PRICE_PRESETS = [
  { label: 'Hasta S/ 500', min: undefined, max: 500 },
  { label: 'S/ 500 – 1.5k', min: 500, max: 1500 },
  { label: 'Más de S/ 1.5k', min: 1500, max: undefined },
] as const;

function sectionActive(...flags: boolean[]): boolean {
  return flags.some(Boolean);
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
  showQuickPresets = true,
}: FilterControlFieldsProps) {
  const categoryDefs = getFiltersForCategory(categoria).filter((d) => d.requiresCategory);
  const chipDefs = categoryDefs.filter((d) => d.type === 'chips' && d.options);
  const toggleDefs = categoryDefs.filter((d) => d.type === 'toggle');

  const u = filters.ubicacion;
  const ubicLabel = u?.distrito || u?.provincia || u?.departamento || 'Elegir distrito o ciudad';
  const hasUbi = Boolean(u?.distrito || u?.provincia || u?.departamento);
  const hasPrecio =
    (filters.precioMin != null && filters.precioMin > 0) ||
    (filters.precioMax != null && filters.precioMax > 0);
  const hasCatFacets =
    chipDefs.some((d) => filters.facets[d.id]) ||
    toggleDefs.some((d) => filters.facets[d.id] === true);

  let step = 1;

  const setFacet = (id: string, value: string | string[] | boolean | undefined) => {
    const facets = { ...filters.facets };
    if (value === undefined || value === false || (Array.isArray(value) && value.length === 0)) {
      delete facets[id];
    } else {
      facets[id] = value;
    }
    onChange({ ...filters, facets });
  };

  const toggleChip = (id: string, value: string) => {
    const current = filters.facets[id];
    setFacet(id, current === value ? undefined : value);
  };

  const renderChipGroup = (def: FilterDefinition) => {
    const current = filters.facets[def.id];
    return (
      <div key={def.id}>
        <span className="mb-1.5 block text-[11px] font-medium text-[var(--text-secondary)]">{def.label}</span>
        <div className="flex flex-wrap gap-1.5">
          {def.options!.map((opt) => {
            const selected = current === opt.value;
            const count =
              categoria !== 'todos'
                ? countFacetOption(adisos, categoria, busqueda, filters, def.id, opt.value, userLat, userLng)
                : undefined;
            const disabled = count === 0;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => toggleChip(def.id, opt.value)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  selected
                    ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                    : disabled
                      ? 'cursor-not-allowed opacity-40 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                }`}
              >
                {opt.label}
                {count != null && count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {showQuickPresets && (
        <FilterQuickPresets categoria={categoria} filters={filters} onChange={onChange} />
      )}

      <FilterSectionCard
        sectionId="ubicacion"
        step={step++}
        title="Dónde"
        subtitle={hasUbi ? ubicLabel : 'Zona o ciudad'}
        icon={<IconLocation size={14} />}
        active={hasUbi}
        completed={hasUbi}
      >
        <button
          type="button"
          onClick={onOpenUbicacion}
          className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
            hasUbi
              ? 'bg-[rgba(var(--brand-primary-rgb),0.08)] font-semibold text-[var(--brand-blue)]'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
          }`}
        >
          <span className="truncate">{ubicLabel}</span>
          <IconChevronRight size={10} className="shrink-0 opacity-50" />
        </button>
        <FilterRadiusControl
          filters={filters}
          onChange={onChange}
          enabled={hasUbi && userLat != null && userLng != null}
        />
        <p className="m-0 text-[10px] leading-relaxed text-[var(--text-tertiary)]">
          Empieza por zona para ver avisos cerca de ti.
        </p>
      </FilterSectionCard>

      {categoria !== 'todos' && (chipDefs.length > 0 || toggleDefs.length > 0) && (
        <FilterSectionCard
          sectionId="tipo"
          step={step++}
          title={`Qué tipo de ${getCategoriaLabel(categoria).toLowerCase()}`}
          subtitle="Operación, modalidad, condición…"
          icon={<IconTag size={14} />}
          active={hasCatFacets}
          completed={hasCatFacets}
        >
          <div className="space-y-2.5">
            {chipDefs.map(renderChipGroup)}
            {toggleDefs.map((def) => (
              <ToggleCheck
                key={def.id}
                label={def.label}
                checked={filters.facets[def.id] === true}
                onToggle={() => setFacet(def.id, filters.facets[def.id] === true ? undefined : true)}
              />
            ))}
          </div>
        </FilterSectionCard>
      )}

      {categoria === 'todos' && (
        <div className="rounded-xl border border-dashed border-[var(--border-color)] px-3 py-2.5 text-[10px] leading-relaxed text-[var(--text-tertiary)]">
          Elige una categoría arriba para desbloquear filtros específicos.
        </div>
      )}

      <FilterSectionCard
        sectionId="presupuesto"
        step={step++}
        title="Presupuesto"
        subtitle="Rango y precio publicado"
        icon={<IconTag size={14} />}
        active={sectionActive(hasPrecio, filters.soloConPrecio !== undefined)}
        completed={sectionActive(hasPrecio, filters.soloConPrecio !== undefined)}
      >
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Mín S/"
            value={filters.precioMin ?? ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : undefined;
              onChange({ ...filters, precioMin: v && v > 0 ? v : undefined });
            }}
            className={`min-w-0 flex-1 rounded-xl px-2.5 py-2 text-xs text-[var(--text-primary)] transition-all outline-none focus:ring-1 focus:ring-[var(--brand-blue)] ${
              filters.precioMin ? 'bg-[rgba(var(--brand-primary-rgb),0.08)] font-semibold text-[var(--brand-blue)]' : 'bg-[var(--bg-tertiary)]'
            }`}
          />
          <span className="text-[var(--text-tertiary)]">—</span>
          <input
            type="number"
            min={0}
            placeholder="Máx S/"
            value={filters.precioMax ?? ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : undefined;
              onChange({ ...filters, precioMax: v && v > 0 ? v : undefined });
            }}
            className={`min-w-0 flex-1 rounded-xl px-2.5 py-2 text-xs text-[var(--text-primary)] transition-all outline-none focus:ring-1 focus:ring-[var(--brand-blue)] ${
              filters.precioMax ? 'bg-[rgba(var(--brand-primary-rgb),0.08)] font-semibold text-[var(--brand-blue)]' : 'bg-[var(--bg-tertiary)]'
            }`}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset) => {
            const active = filters.precioMin === preset.min && filters.precioMax === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    precioMin: preset.min,
                    precioMax: preset.max,
                  })
                }
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all ${
                  active
                    ? 'bg-[var(--brand-blue)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <TriStateSegment
          compact
          label="Precio indicado en el aviso"
          value={filters.soloConPrecio}
          onChange={(v) => onChange({ ...filters, soloConPrecio: v })}
          labels={['Todos', 'Con precio', 'Sin precio']}
        />
      </FilterSectionCard>

      <FilterSectionCard
        sectionId="calidad"
        step={step++}
        title="Calidad del aviso"
        subtitle="Fotos y presentación"
        icon={<IconImage size={14} />}
        active={filters.conFotos !== undefined}
        completed={filters.conFotos === true}
      >
        <TriStateSegment
          compact
          label="Fotos"
          value={filters.conFotos}
          onChange={(v) => onChange({ ...filters, conFotos: v })}
          labels={['Todos', 'Con fotos', 'Sin fotos']}
        />
      </FilterSectionCard>

      <FilterSectionCard
        sectionId="confianza"
        step={step++}
        title="Confianza"
        subtitle="Vendedores y visibilidad"
        icon={<IconShield size={14} />}
        active={sectionActive(Boolean(filters.verificado), Boolean(filters.destacado))}
        completed={sectionActive(Boolean(filters.verificado), Boolean(filters.destacado))}
      >
        <ToggleCheck
          label="Anunciante verificado"
          checked={Boolean(filters.verificado)}
          onToggle={() => onChange({ ...filters, verificado: filters.verificado ? undefined : true })}
          icon={<IconUserCheck size={12} />}
        />
        <ToggleCheck
          label="Solo destacados"
          checked={Boolean(filters.destacado)}
          onToggle={() => onChange({ ...filters, destacado: filters.destacado ? undefined : true })}
          icon={<IconMedal size={12} />}
        />
      </FilterSectionCard>

      <FilterSectionCard
        sectionId="fecha"
        step={step++}
        title="Publicación reciente"
        subtitle="Antigüedad del aviso"
        icon={<IconCalendar size={14} />}
        active={Boolean(filters.publicadoEn)}
        completed={Boolean(filters.publicadoEn)}
      >
        <FilterSelect
          value={filters.publicadoEn}
          placeholder="Cualquier fecha"
          options={[
            { value: '24h', label: 'Últimas 24 horas' },
            { value: '7d', label: 'Última semana' },
            { value: '30d', label: 'Último mes' },
          ]}
          onChange={(v) => onChange({ ...filters, publicadoEn: v as BrowseFilterState['publicadoEn'] })}
        />
      </FilterSectionCard>
    </div>
  );
}
