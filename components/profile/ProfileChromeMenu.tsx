'use client';

import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  header?: ReactNode;
}

export default function ProfileChromeMenu({
  items,
  className,
  buttonClassName,
  header,
}: ProfileChromeMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);

  const updatePosition = () => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onReposition = () => updatePosition();
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  if (visible.length === 0) return null;

  const menu = open && coords && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed min-w-[220px] rounded-xl border border-slate-200 bg-white shadow-xl py-1 z-[300] overflow-hidden"
          style={{ top: coords.top, right: coords.right }}
        >
          {header}
          {visible.map((item) =>
            item.href ? (
              <a
                key={item.id}
                href={item.href}
                role="menuitem"
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
                role="menuitem"
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
        </div>,
        document.body
      )
    : null;

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
        aria-haspopup="menu"
      >
        <IconEllipsisV size={18} />
      </button>
      {menu}
    </div>
  );
}
