'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IconSearch, IconMegaphone } from './Icons';
export type ComposerMode = 'search' | 'publish';

interface ComposerModeToggleProps {
  mode: ComposerMode;
  onChange: (mode: ComposerMode) => void;
  className?: string;
  /** Solo íconos (panel lateral / espacio reducido) */
  iconsOnly?: boolean;
}

export default function ComposerModeToggle({ mode, onChange, className = '', iconsOnly = false }: ComposerModeToggleProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLButtonElement>(null);
  const publishRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState({ width: 0, x: 0 });

  const measurePill = useCallback(() => {
    const track = trackRef.current;
    const active = mode === 'search' ? searchRef.current : publishRef.current;
    if (!track || !active) return;
    const trackRect = track.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setPill({
      width: activeRect.width,
      x: activeRect.left - trackRect.left,
    });
  }, [mode]);

  useLayoutEffect(() => {
    measurePill();
  }, [measurePill]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measurePill());
    ro.observe(track);
    return () => ro.disconnect();
  }, [measurePill]);

  const spring = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.85 };

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label="Buscar o publicar"
      className={`composer-mode-track relative flex shrink-0 items-center rounded-full bg-[var(--bg-tertiary)] p-0.5 ${
        iconsOnly ? 'mr-1.5' : 'mr-2.5 md:mr-3'
      } ${className}`}
    >
      <motion.div
        className="composer-mode-pill absolute top-0.5 bottom-0.5 rounded-full pointer-events-none"
        initial={false}
        animate={{
          width: pill.width,
          x: pill.x,
          backgroundColor: mode === 'search' ? 'var(--bg-primary)' : 'var(--bg-primary)',
          boxShadow:
            mode === 'search'
              ? '0 2px 8px rgba(var(--brand-primary-rgb), 0.22), 0 1px 2px rgba(0,0,0,0.06)'
              : '0 2px 8px rgba(var(--brand-yellow-rgb), 0.28), 0 1px 2px rgba(0,0,0,0.06)',
        }}
        transition={spring}
      />

      <motion.button
        ref={searchRef}
        type="button"
        role="tab"
        aria-selected={mode === 'search'}
        aria-label="Buscar"
        title="Buscar"
        onClick={() => onChange('search')}
        className={`relative z-[1] flex items-center justify-center rounded-full font-semibold ${
          iconsOnly ? 'w-7 h-7' : 'gap-1 text-[11px] md:text-xs h-8 md:h-9 min-w-[36px] md:min-w-0 md:px-3'
        }`}
        whileTap={{ scale: 0.94 }}
      >
        <motion.span
          animate={{
            scale: mode === 'search' ? 1.08 : 1,
            color: mode === 'search' ? 'var(--brand-blue)' : 'var(--text-tertiary)',
          }}
          transition={spring}
          className="flex items-center gap-1"
        >
          <IconSearch size={iconsOnly ? 13 : 14} color="currentColor" />
          {!iconsOnly && <span className="hidden md:inline">Buscar</span>}
        </motion.span>
      </motion.button>

      <motion.button
        ref={publishRef}
        type="button"
        role="tab"
        aria-selected={mode === 'publish'}
        aria-label="Publicar"
        title="Publicar"
        onClick={() => onChange('publish')}
        className={`relative z-[1] flex items-center justify-center rounded-full font-semibold ${
          iconsOnly ? 'w-7 h-7' : 'gap-1 text-[11px] md:text-xs h-8 md:h-9 min-w-[36px] md:min-w-0 md:px-3'
        }`}
        whileTap={{ scale: 0.94 }}
      >
        <motion.span
          animate={{
            scale: mode === 'publish' ? 1.08 : 1,
            color: mode === 'publish' ? 'var(--brand-yellow)' : 'var(--text-tertiary)',
          }}
          transition={spring}
          className="flex items-center gap-1"
        >
          <IconMegaphone size={iconsOnly ? 13 : 14} color="currentColor" />
          {!iconsOnly && <span className="hidden md:inline">Publicar</span>}
        </motion.span>
      </motion.button>
    </div>
  );
}
