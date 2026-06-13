'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IconCheck, IconChevronDown } from '@/components/Icons';

/**
 * Fila de selector de 3 estados: indiferente / sí / no.
 * Usado para filtros que admiten "todos", "con X" o "sin X".
 */
export function TriStateSegment({
  label,
  value,
  onChange,
  labels = ['Todos', 'Con', 'Sin'],
}: {
  label: string;
  value: boolean | undefined;
  onChange: (next: boolean | undefined) => void;
  labels?: [string, string, string];
}) {
  const options: { value: boolean | undefined; label: string }[] = [
    { value: undefined, label: labels[0] },
    { value: true, label: labels[1] },
    { value: false, label: labels[2] },
  ];

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
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors hover:bg-[var(--hover-bg)] min-h-[40px]"
    >
      <span
        className={`flex-shrink-0 w-[18px] h-[18px] rounded-md flex items-center justify-center transition-all ${
          checked
            ? 'bg-[var(--brand-blue)]'
            : 'bg-[var(--bg-tertiary)] border border-[var(--border-color)]'
        }`}
      >
        {checked && <IconCheck size={10} color="white" />}
      </span>
      <span className={`text-sm transition-colors ${checked ? 'text-[var(--brand-blue)] font-semibold' : 'text-[var(--text-primary)]'}`}>
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
