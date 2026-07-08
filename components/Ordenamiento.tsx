'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IconSort, IconSortDown, IconSortUp, IconChevronDown } from './Icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { BROWSE_SORT_OPTIONS, type TipoOrdenamiento } from '@/lib/filters/sort-options';

export type { TipoOrdenamiento };

export type SortIconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  className?: string;
}>;

export interface OrdenamientoOption<V extends string = TipoOrdenamiento> {
  valor: V;
  labelKey?: string;
  label?: string;
  icon: SortIconComponent;
}

interface OrdenamientoProps<V extends string = TipoOrdenamiento> {
  valor: V;
  onChange: (valor: V) => void;
  options?: OrdenamientoOption<V>[];
  ariaLabel?: string;
  sheetTitle?: string;
  /** `icon` = solo icono fijo, sin pill ni etiqueta */
  variant?: 'pill' | 'icon';
  triggerIcon?: SortIconComponent;
}

const SORT_ICONS: Record<TipoOrdenamiento, SortIconComponent> = {
  recientes: IconSortDown,
  antiguos: IconSortUp,
  'titulo-asc': IconSort,
  'titulo-desc': IconSort,
  'precio-asc': IconSortUp,
  'precio-desc': IconSortDown,
};

function getOptionLabel<V extends string>(
  opt: OrdenamientoOption<V>,
  t: (key: string) => string
): string {
  if (opt.label) return opt.label;
  if (opt.labelKey) return t(opt.labelKey);
  return opt.valor;
}

export default function Ordenamiento<V extends string = TipoOrdenamiento>({
  valor,
  onChange,
  options,
  ariaLabel,
  sheetTitle,
  variant = 'pill',
  triggerIcon: TriggerIconProp,
}: OrdenamientoProps<V>) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const opcionesOrdenamiento = useMemo(() => {
    if (options?.length) return options;
    return BROWSE_SORT_OPTIONS.map((opt) => ({
      valor: opt.value as V,
      labelKey: opt.labelKey,
      icon: SORT_ICONS[opt.value],
    }));
  }, [options]);

  const sortLabel = ariaLabel ?? t('sort.label');
  const sortSheetTitle = sheetTitle ?? 'Ordenar resultados';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const opcionActual = opcionesOrdenamiento.find((opt) => opt.valor === valor) || opcionesOrdenamiento[0];
  const CurrentIcon = variant === 'icon' ? (TriggerIconProp ?? IconSort) : opcionActual.icon;
  const iconOnly = variant === 'icon';

  const handleSelect = (nuevoValor: V) => {
    onChange(nuevoValor);
    setIsOpen(false);
  };

  const optionList = opcionesOrdenamiento.map((opcion) => {
    const OptionIcon = opcion.icon;
    const isSelected = valor === opcion.valor;
    return (
      <button
        key={opcion.valor}
        type="button"
        onClick={() => handleSelect(opcion.valor)}
        style={{
          width: '100%',
          padding: isMobile ? '14px 16px' : '10px 14px',
          textAlign: 'left',
          border: 'none',
          borderRadius: '12px',
          backgroundColor: isSelected ? 'rgba(var(--brand-primary-rgb), 0.12)' : 'transparent',
          color: isSelected ? 'var(--brand-blue)' : 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: isSelected ? 600 : 500,
          minHeight: isMobile ? '48px' : undefined,
        }}
      >
        <OptionIcon size={14} color={isSelected ? 'var(--brand-blue)' : undefined} />
        <span>{getOptionLabel(opcion, t)}</span>
        {isSelected && <span style={{ marginLeft: 'auto', color: 'var(--brand-blue)' }}>●</span>}
      </button>
    );
  });

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={sortLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={
          iconOnly
            ? undefined
            : {
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.25rem' : '0.5rem',
                padding: isMobile ? '0 10px' : '0 0.875rem',
                border: 'none',
                borderRadius: '14px',
                color: 'var(--text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '42px',
                minWidth: isMobile ? '42px' : undefined,
              }
        }
        className={
          iconOnly
            ? 'p-2.5 rounded-xl text-slate-400 hover:text-slate-600 transition-colors shrink-0 inline-flex items-center justify-center'
            : 'brand-pill-glass hover:shadow-md motion-reduce:hover:translate-y-0 hover:-translate-y-0.5'
        }
      >
        <CurrentIcon
          size={16}
          aria-hidden="true"
          className={iconOnly ? undefined : 'text-[var(--brand-blue)]'}
          color={iconOnly ? 'currentColor' : undefined}
        />
        {!iconOnly && mounted && !isMobile && (
          <>
            <span className="max-w-[120px] truncate">{getOptionLabel(opcionActual, t)}</span>
            <span
              aria-hidden
              style={{
                marginLeft: '2px',
                opacity: 0.75,
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                display: 'inline-flex',
              }}
            >
              <IconChevronDown size={12} color="var(--text-tertiary)" />
            </span>
          </>
        )}
      </button>

      {isOpen && !isMobile && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '16px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05)',
            zIndex: 2000,
            minWidth: '200px',
            overflow: 'hidden',
            padding: '4px',
          }}
        >
          {optionList}
        </div>
      )}

      {isOpen && isMobile && (
        <>
          <div
            role="presentation"
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 1100,
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={sortLabel}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1101,
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '20px 20px 0 0',
              padding: '12px 12px calc(12px + env(safe-area-inset-bottom))',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 4,
                backgroundColor: 'var(--border-color)',
                margin: '4px auto 12px',
              }}
            />
            <div style={{ fontSize: '0.9rem', fontWeight: 700, padding: '4px 8px 12px', color: 'var(--text-primary)' }}>
              {sortSheetTitle}
            </div>
            {optionList}
          </div>
        </>
      )}
    </div>
  );
}
