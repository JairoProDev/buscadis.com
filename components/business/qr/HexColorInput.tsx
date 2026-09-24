'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { tokens } from '@buscadis/tokens';
import { QR_DEFAULTS, QR_KIT } from '@/lib/qr/kit-colors';

interface HexColorInputProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  debounceMs?: number;
}

function normalizeHex(v: string): string {
  let h = v.trim();
  if (!h.startsWith('#')) h = `#${h}`;
  if (/^#[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase();
  return v;
}

const QUICK_SWATCHES = [
  QR_DEFAULTS.dots,
  QR_DEFAULTS.dotsDark,
  tokens['--bs-danger-fg'],
  tokens['--bs-cat-productos-fg'],
  tokens['--bs-action'],
  QR_KIT.defaultTheme,
  tokens['--bs-success-fg'],
  tokens['--bs-warning-fg'],
  tokens['--bs-cat-eventos-fg'],
  QR_DEFAULTS.bg,
  tokens['--bs-color-neutral-900'],
];

export function HexColorInput({
  label,
  value,
  onChange,
  debounceMs = 400,
}: HexColorInputProps) {
  const [local, setLocal] = useState(value);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const commit = useCallback(
    (hex: string) => {
      const next = normalizeHex(hex);
      if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next);
    },
    [onChange]
  );

  const scheduleCommit = useCallback(
    (hex: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => commit(hex), debounceMs);
    },
    [commit, debounceMs]
  );

  const safe = /^#[0-9a-fA-F]{6}$/.test(local) ? local : QR_DEFAULTS.dots;

  return (
    <div
      ref={rootRef}
      className="block text-xs font-bold text-slate-600"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {label}
      <div className="mt-1 flex gap-2 items-center relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="w-10 h-9 rounded-lg border border-slate-200 shrink-0 shadow-inner"
          style={{ backgroundColor: safe }}
          aria-label={`${label} elegir color`}
          aria-expanded={open}
        />
        <input
          type="text"
          value={local}
          onChange={(e) => {
            const raw = e.target.value;
            setLocal(raw);
            const next = normalizeHex(raw);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) scheduleCommit(next);
          }}
          onBlur={(e) => {
            const next = normalizeHex(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) {
              setLocal(next);
              commit(next);
            } else {
              setLocal(value);
            }
          }}
          placeholder={QR_DEFAULTS.dots}
          className={cn(
            'flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-slate-200',
            'font-mono text-xs uppercase tracking-wide bg-white'
          )}
          spellCheck={false}
        />

        {open && (
          <div
            className="absolute left-0 top-full z-[250] mt-1 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-6 gap-1.5">
              {QUICK_SWATCHES.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => {
                    setLocal(hex);
                    commit(hex);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-7 h-7 rounded-md border border-slate-200',
                    hex === safe && 'ring-2 ring-blue-500 ring-offset-1'
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
