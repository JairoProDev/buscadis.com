'use client';

import type { Categoria } from '@/types';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';
import {
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad,
} from '@/components/Icons';

const CATEGORIES: { id: Categoria; label: string; Icon: typeof IconEmpleos }[] = [
  { id: 'empleos', label: 'Empleos', Icon: IconEmpleos },
  { id: 'inmuebles', label: 'Inmuebles', Icon: IconInmuebles },
  { id: 'vehiculos', label: 'Vehículos', Icon: IconVehiculos },
  { id: 'servicios', label: 'Servicios', Icon: IconServicios },
  { id: 'productos', label: 'Productos', Icon: IconProductos },
  { id: 'eventos', label: 'Eventos', Icon: IconEventos },
  { id: 'negocios', label: 'Negocios', Icon: IconNegocios },
  { id: 'comunidad', label: 'Comunidad', Icon: IconComunidad },
];

interface CategoryRailProps {
  selected: Categoria | 'todos';
  onSelect: (id: Categoria) => void;
  desktop?: boolean;
}

/** Misma fila de categorías que el inicio. */
export default function CategoryRail({ selected, onSelect, desktop = false }: CategoryRailProps) {
  return (
    <div
      className="no-scrollbar"
      style={{
        display: 'flex',
        justifyContent: desktop ? 'center' : 'flex-start',
        overflowX: 'auto',
        overflowY: 'hidden',
        gap: desktop ? '1.125rem' : '0.5rem',
        padding: desktop ? '0.25rem 0.25rem 0.125rem' : '0.125rem 0.125rem 0',
        scrollbarWidth: 'none',
        alignItems: 'center',
      }}
    >
      {CATEGORIES.map(({ id, label, Icon }) => {
        const isActive = selected === id;
        const catTheme = getCategoriaThemeTokens(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-pressed={isActive}
            className="group"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: desktop ? '0.45rem' : '0.3rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              minWidth: desktop ? '76px' : '62px',
              flexShrink: 0,
              padding: '2px',
              borderRadius: '12px',
              opacity: isActive ? 1 : 0.85,
              transition: 'opacity 0.2s ease',
            }}
          >
            <div
              style={{
                width: desktop ? '52px' : '44px',
                height: desktop ? '52px' : '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: desktop ? '16px' : '14px',
                boxSizing: 'border-box',
                border: `1.5px solid ${isActive ? catTheme.accent : 'var(--bs-border-default, var(--border-color))'}`,
                backgroundColor: isActive ? catTheme.placeholderBg : 'var(--bs-bg-sunken, var(--bg-tertiary))',
                color: isActive ? catTheme.accent : 'var(--text-secondary)',
                transition: 'border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Icon size={desktop ? 26 : 22} color={isActive ? catTheme.accent : undefined} />
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '3px',
                  backgroundColor: catTheme.accent,
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: desktop ? '0.8125rem' : '0.6875rem',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                color: isActive ? catTheme.accent : 'var(--text-secondary)',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
