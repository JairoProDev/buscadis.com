'use client';

import { useEffect, useRef, useState } from 'react';
import { IconEllipsisV } from '@/components/Icons';
import { cn } from '@/lib/utils';

export interface ProfileMenuItem {
  id: string;
  label: string;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
  hidden?: boolean;
}

interface ProfileChromeMenuProps {
  items: ProfileMenuItem[];
  className?: string;
  buttonClassName?: string;
}

export default function ProfileChromeMenu({
  items,
  className,
  buttonClassName,
}: ProfileChromeMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (visible.length === 0) return null;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'h-9 w-9 flex items-center justify-center rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors',
          buttonClassName
        )}
        aria-label="Más opciones"
        aria-expanded={open}
      >
        <IconEllipsisV size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[200px] rounded-xl border border-slate-200 bg-white shadow-xl py-1 z-[120]">
          {visible.map((item) =>
            item.href ? (
              <a
                key={item.id}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                className={cn(
                  'block w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50',
                  item.destructive ? 'text-red-600' : 'text-slate-800'
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={cn(
                  'block w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50',
                  item.destructive ? 'text-red-600' : 'text-slate-800'
                )}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
