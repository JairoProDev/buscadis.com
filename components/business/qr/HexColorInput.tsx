'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

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

const BODY_LOCK_FLAG = 'data-qr-color-picker';

/** El picker nativo + overflow:hidden en el modal bloquea clicks en el SO. */
function releaseBodyScrollLock() {
  if (document.body.style.overflow === 'hidden') {
    document.body.setAttribute(BODY_LOCK_FLAG, '1');
    document.body.style.overflow = '';
  }
}

function restoreBodyScrollLock() {
  if (document.body.getAttribute(BODY_LOCK_FLAG) === '1') {
    document.body.style.overflow = 'hidden';
    document.body.removeAttribute(BODY_LOCK_FLAG);
  }
}

export function HexColorInput({
  label,
  value,
  onChange,
  debounceMs = 500,
}: HexColorInputProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickingRef = useRef(false);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pickingRef.current) restoreBodyScrollLock();
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

  const safe = /^#[0-9a-fA-F]{6}$/.test(local) ? local : '#1e293b';

  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
      <div className="mt-1 flex gap-2 items-center">
        <input
          type="color"
          value={safe}
          className="w-10 h-9 rounded-lg cursor-pointer border border-slate-200 shrink-0 p-0.5"
          aria-label={`${label} selector`}
          onPointerDown={() => {
            pickingRef.current = true;
            releaseBodyScrollLock();
          }}
          onFocus={() => {
            pickingRef.current = true;
            releaseBodyScrollLock();
          }}
          onBlur={() => {
            pickingRef.current = false;
            window.setTimeout(() => {
              restoreBodyScrollLock();
              commit(local);
            }, 250);
          }}
          onChange={(e) => {
            const hex = e.target.value;
            setLocal(hex);
            scheduleCommit(hex);
          }}
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
