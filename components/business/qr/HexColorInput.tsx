'use client';

import { cn } from '@/lib/utils';

interface HexColorInputProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

function normalizeHex(v: string): string {
  let h = v.trim();
  if (!h.startsWith('#')) h = `#${h}`;
  if (/^#[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase();
  return v;
}

export function HexColorInput({ label, value, onChange }: HexColorInputProps) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#1e293b';

  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
      <div className="mt-1 flex gap-2 items-center">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded-lg cursor-pointer border border-slate-200 shrink-0 p-0.5"
          aria-label={`${label} selector`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const next = normalizeHex(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next);
            else onChange(e.target.value);
          }}
          onBlur={(e) => {
            const next = normalizeHex(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next);
          }}
          placeholder="#1e293b"
          className={cn(
            'flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-slate-200',
            'font-mono text-xs uppercase tracking-wide bg-white'
          )}
          spellCheck={false}
        />
      </div>
    </label>
  );
}
