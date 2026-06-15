'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { IconChevronDown, IconSearch, IconClose } from '@/components/Icons';
import CountryFlag from '@/components/location/CountryFlag';

export interface ComboboxOption {
  value: string;
  label: string;
  /** ISO 3166-1 alpha-2 — muestra bandera real (no emoji) */
  countryCode?: string;
  sublabel?: string;
}

interface LocationComboboxProps {
  label: string;
  placeholder?: string;
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  showFlag?: boolean;
  emptyMessage?: string;
}

export default function LocationCombobox({
  label,
  placeholder = 'Buscar…',
  value,
  options,
  onChange,
  disabled = false,
  loading = false,
  showFlag = false,
  emptyMessage = 'Sin resultados',
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter((o) => {
        const q = query.toLowerCase();
        return (
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(q))
        );
      })
    : options;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
    }
  }, [open]);

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <label
        style={{
          display: 'block',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--brand-blue)',
          marginBottom: '6px',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: '12px',
          border: open ? '2px solid var(--brand-blue)' : '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(var(--brand-primary-rgb), 0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {showFlag && selected?.countryCode && (
          <CountryFlag code={selected.countryCode} size={22} />
        )}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.95rem',
              fontWeight: value ? 600 : 500,
              color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selected?.label || placeholder}
          </span>
          {selected?.sublabel && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              {selected.sublabel}
            </span>
          )}
        </span>
        <span
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--text-tertiary)',
            flexShrink: 0,
          }}
          aria-hidden
        >
          <IconChevronDown size={14} />
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1200,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <IconSearch size={14} color="var(--text-tertiary)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 2,
                  color: 'var(--text-tertiary)',
                }}
              >
                <IconClose size={12} />
              </button>
            )}
          </div>

          <ul
            id={listId}
            role="listbox"
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              margin: 0,
              padding: '6px',
              listStyle: 'none',
            }}
          >
            {loading ? (
              <li style={{ padding: '12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Cargando…
              </li>
            ) : filtered.length === 0 ? (
              <li style={{ padding: '12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                {emptyMessage}
              </li>
            ) : (
              filtered.map((opt) => {
                const active = opt.value === value;
                return (
                  <li key={opt.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        border: 'none',
                        borderRadius: '10px',
                        backgroundColor: active
                          ? 'rgba(var(--brand-primary-rgb), 0.12)'
                          : 'transparent',
                        color: active ? 'var(--brand-blue)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: active ? 700 : 500,
                        fontSize: '0.9rem',
                      }}
                    >
                      {showFlag && opt.countryCode && (
                        <CountryFlag code={opt.countryCode} size={20} />
                      )}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block' }}>{opt.label}</span>
                        {opt.sublabel && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {opt.sublabel}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
