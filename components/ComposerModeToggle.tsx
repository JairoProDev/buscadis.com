'use client';

import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
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

const MODES: ComposerMode[] = ['search', 'publish'];

export default function ComposerModeToggle({
  mode,
  onChange,
  className = '',
  iconsOnly = false,
}: ComposerModeToggleProps) {
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

  const focusMode = (next: ComposerMode) => {
    onChange(next);
    const el = next === 'search' ? searchRef.current : publishRef.current;
    el?.focus();
  };

  const onTablistKeyDown = (e: KeyboardEvent) => {
    const idx = MODES.indexOf(mode);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusMode(MODES[(idx + 1) % MODES.length]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusMode(MODES[(idx - 1 + MODES.length) % MODES.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusMode('search');
    } else if (e.key === 'End') {
      e.preventDefault();
      focusMode('publish');
    }
  };

  const spring = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.85 };

  return (
    <div
      ref={trackRef}
      role="tablist"
      aria-label="Buscar o publicar"
      onKeyDown={onTablistKeyDown}
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
          backgroundColor: 'var(--bg-primary)',
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
        tabIndex={mode === 'search' ? 0 : -1}
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
        tabIndex={mode === 'publish' ? 0 : -1}
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
