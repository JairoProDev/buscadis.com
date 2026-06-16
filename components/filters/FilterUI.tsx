'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IconCheck, IconChevronDown } from '@/components/Icons';

/**
 * Chips de 3 estados compactos (todos / sí / no).
 */
export function OptionChips({
  value,
  onChange,
  options,
}: {
  value: boolean | undefined;
  onChange: (next: boolean | undefined) => void;
  options: { value: boolean | undefined; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
              selected
                ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Fila de selector de 3 estados: indiferente / sí / no.
 * Usado para filtros que admiten "todos", "con X" o "sin X".
 */
export function TriStateSegment({
  label,
  value,
  onChange,
  labels = ['Todos', 'Con', 'Sin'],
  compact,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (next: boolean | undefined) => void;
  labels?: [string, string, string];
  compact?: boolean;
}) {
  const options: { value: boolean | undefined; label: string }[] = [
    { value: undefined, label: labels[0] },
    { value: true, label: labels[1] },
    { value: false, label: labels[2] },
  ];

  if (compact) {
    return (
      <div>
        <span className="mb-1.5 block text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
        <OptionChips value={value} onChange={onChange} options={options} />
      </div>
    );
  }

  return (
    <div>
      <span className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 block">{label}</span>
      <div className="inline-flex w-full rounded-xl bg-[var(--bg-tertiary)] p-1 gap-1">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                selected
                  ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Fila con checkbox: activa/desactiva el filtro directamente al hacer click,
 * sin pasos intermedios tipo "Activar".
 */
export function ToggleCheck({
  label,
  checked,
  onToggle,
  icon,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-1.5 py-1.5 rounded-xl text-left transition-colors hover:bg-[var(--hover-bg)] min-h-[36px]"
    >
      {icon && (
        <span className={`flex-shrink-0 ${checked ? 'text-[var(--brand-blue)]' : 'text-[var(--text-tertiary)]'}`}>
          {icon}
        </span>
      )}
      <span
        className={`flex-shrink-0 w-[16px] h-[16px] rounded-md flex items-center justify-center transition-all ${
          checked
            ? 'bg-[var(--brand-blue)]'
            : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]'
        }`}
      >
        {checked && <IconCheck size={9} color="white" />}
      </span>
      <span className={`text-xs transition-colors ${checked ? 'text-[var(--brand-blue)] font-semibold' : 'text-[var(--text-primary)]'}`}>
        {label}
      </span>
    </button>
  );
}

/**
 * Select estilizado (no usa el <select> nativo del navegador).
 */
export function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string | undefined;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = value ? options.find((o) => o.value === value) : undefined;
  const hasValue = Boolean(current);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
          hasValue
            ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)] font-semibold'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
        }`}
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <IconChevronDown size={11} className={`flex-shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-[var(--bg-primary)] shadow-lg p-1 animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 0 0 1px var(--border-color)' }}
        >
          <button
            type="button"
            onClick={() => { onChange(undefined); setOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--hover-bg)] ${!hasValue ? 'text-[var(--brand-blue)] font-semibold' : 'text-[var(--text-primary)]'}`}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--hover-bg)] ${
                value === opt.value ? 'text-[var(--brand-blue)] font-semibold' : 'text-[var(--text-primary)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
