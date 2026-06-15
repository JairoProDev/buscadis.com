'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface HeaderPopoverPanelProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  /** Ancho máximo en desktop (px) */
  maxWidth?: number;
}

export default function HeaderPopoverPanel({
  open,
  anchorRef,
  onClose,
  children,
  maxWidth = 384,
}: HeaderPopoverPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(maxWidth, window.innerWidth - margin * 2);
    let left = rect.right - width;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    setStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left,
      width,
      zIndex: 1100,
      maxHeight: `min(80vh, calc(100vh - ${rect.bottom + 16}px))`,
    });
  }, [anchorRef, maxWidth]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[1099] bg-black/20 sm:bg-transparent"
        aria-hidden
        onClick={onClose}
      />
      <div style={style} className="flex flex-col overflow-hidden">
        {children}
      </div>
    </>,
    document.body
  );
}
