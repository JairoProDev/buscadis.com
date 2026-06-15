'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Adiso } from '@/types';
import {
  IconAdiso,
  IconMap,
  IconMegaphone,
  IconAdis,
  IconMinimize,
} from './Icons';
import ModalAdiso from './ModalAdiso';
import MapaInteractivo from './MapaInteractivo';
import PublishSidebarFlow from './PublishSidebarFlow';
import ChatbotIANew from './ChatbotIANew';
import { useNavigation } from '@/contexts/NavigationContext';

export type SeccionSidebar = 'adiso' | 'mapa' | 'publicar' | 'chatbot' | 'gratuitos' | 'negocio';

interface SidebarDesktopProps {
  adisoAbierto: Adiso | null;
  onCerrarAdiso: () => void;
  onAnterior: () => void;
  onSiguiente: () => void;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
  onPublicar: (adiso: Adiso) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  seccionActiva: SeccionSidebar;
  onSeccionChange?: (seccion: SeccionSidebar) => void;
  onMinimizadoChange?: (minimizado: boolean) => void;
  todosLosAdisos?: Adiso[];
  minimizado?: boolean;
}

const SIDEBAR_WIDTH = 420;
const COLLAPSED_RAIL = 48;
const HEADER_HEIGHT = 'var(--header-height, 72px)';

const PANEL_TABS: {
  id: SeccionSidebar;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { id: 'adiso', label: 'Detalle', shortLabel: 'Detalle', Icon: IconAdiso },
  { id: 'mapa', label: 'Mapa', shortLabel: 'Mapa', Icon: IconMap },
  { id: 'chatbot', label: 'ADIS', shortLabel: 'ADIS', Icon: IconAdis },
  { id: 'publicar', label: 'Publicar', shortLabel: 'Publicar', Icon: IconMegaphone },
];

function SidebarLauncher({
  onSelect,
}: {
  onSelect: (seccion: SeccionSidebar) => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <p className="mb-1 text-center text-sm font-semibold text-[var(--text-primary)]">
        Panel lateral
      </p>
      <p className="mb-5 text-center text-xs leading-relaxed text-[var(--text-secondary)]">
        Abre herramientas aquí sin salir del buscador. También puedes ir a la página completa
        desde el menú superior.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PANEL_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--border-color)] brand-mesh-glass px-3 py-4 text-center transition-colors hover:border-[var(--brand-blue)]/40 hover:bg-[var(--hover-bg)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(var(--brand-primary-rgb),0.1)]">
              <Icon
                size={18}
                color={id === 'publicar' ? 'var(--brand-yellow)' : 'var(--brand-blue)'}
              />
            </span>
            <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SidebarSectionTabs({
  active,
  onChange,
  onMinimize,
}: {
  active: SeccionSidebar;
  onChange: (seccion: SeccionSidebar) => void;
  onMinimize: () => void;
}) {
  return (
    <div
        className="flex shrink-0 items-center gap-1 border-b border-[var(--border-color)] px-2 py-2 brand-mesh-strip"
        style={{ backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 80%, transparent)' }}
    >
      <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto no-scrollbar">
        {PANEL_TABS.map(({ id, shortLabel, Icon }) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              title={shortLabel}
              className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                selected
                  ? 'bg-[var(--brand-blue)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              <Icon size={12} color={selected ? 'white' : 'var(--text-secondary)'} />
              <span>{shortLabel}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onMinimize}
        aria-label="Ocultar panel"
        title="Ocultar panel"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
      >
        <IconMinimize size={14} />
      </button>
    </div>
  );
}

/**
 * Panel lateral derecho — participa en el layout flex (no overlay).
 */
export default function SidebarDesktop({
  adisoAbierto,
  onCerrarAdiso,
  onAnterior,
  onSiguiente,
  puedeAnterior,
  puedeSiguiente,
  onPublicar,
  onError,
  onSuccess,
  seccionActiva,
  onSeccionChange,
  onMinimizadoChange,
  todosLosAdisos = [],
  minimizado = true,
}: SidebarDesktopProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [internalMinimizado, setInternalMinimizado] = useState(minimizado);
  const { setSidebarExpanded, abrirAdiso } = useNavigation();

  useEffect(() => {
    setInternalMinimizado(minimizado);
  }, [minimizado]);

  useEffect(() => {
    setSidebarExpanded(!internalMinimizado);
  }, [internalMinimizado, setSidebarExpanded]);

  const expandWithSection = useCallback(
    (seccion: SeccionSidebar) => {
      onSeccionChange?.(seccion);
      setInternalMinimizado(false);
      onMinimizadoChange?.(false);
    },
    [onSeccionChange, onMinimizadoChange]
  );

  const handleMinimizarToggle = () => {
    const nuevoEstado = !internalMinimizado;
    setInternalMinimizado(nuevoEstado);
    onMinimizadoChange?.(nuevoEstado);
  };

  const handleMapAbrirAdiso = (adiso: Adiso) => {
    abrirAdiso(adiso.id);
    onSeccionChange?.('adiso');
  };

  if (!isDesktop) return null;

  if (internalMinimizado) {
    return (
      <aside
        className="mx-1 mt-2 flex shrink-0 flex-col gap-1 self-start"
        style={{
          width: COLLAPSED_RAIL,
          position: 'sticky',
          top: `calc(${HEADER_HEIGHT} + 8px)`,
          zIndex: 500,
        }}
      >
        {PANEL_TABS.map(({ id, shortLabel, Icon }) => {
          const isActive = seccionActiva === id && !internalMinimizado;
          return (
            <button
              key={id}
              type="button"
              onClick={() => expandWithSection(id)}
              title={shortLabel}
              aria-label={shortLabel}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-colors ${
                isActive
                  ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.12)] text-[var(--brand-blue)]'
                  : 'border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--brand-blue)]/40 hover:text-[var(--brand-blue)]'
              }`}
            >
              <Icon
                size={16}
                color={
                  id === 'publicar'
                    ? 'var(--brand-yellow)'
                    : isActive
                      ? 'var(--brand-blue)'
                      : undefined
                }
              />
            </button>
          );
        })}
      </aside>
    );
  }

  const showAdisoDetail = seccionActiva === 'adiso' && adisoAbierto;
  const showAdisoEmpty = seccionActiva === 'adiso' && !adisoAbierto;

  return (
    <aside
      className="shrink-0 self-start overflow-hidden"
      style={{
        width: SIDEBAR_WIDTH,
        position: 'sticky',
        top: HEADER_HEIGHT,
        height: `calc(100vh - ${HEADER_HEIGHT})`,
        zIndex: 900,
        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        className="brand-mesh-glass flex h-full flex-col overflow-hidden"
        style={{
          boxShadow: '-10px 0 30px rgba(0,0,0,0.03)',
          borderTopLeftRadius: '24px',
          borderBottomLeftRadius: '24px',
        }}
      >
        <SidebarSectionTabs
          active={seccionActiva}
          onChange={(seccion) => onSeccionChange?.(seccion)}
          onMinimize={handleMinimizarToggle}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={seccionActiva}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {showAdisoDetail && (
              <ModalAdiso
                adiso={adisoAbierto}
                onCerrar={onCerrarAdiso}
                onAnterior={onAnterior}
                onSiguiente={onSiguiente}
                puedeAnterior={puedeAnterior}
                puedeSiguiente={puedeSiguiente}
                dentroSidebar={true}
                onSuccess={onSuccess}
                onError={onError}
              />
            )}

            {showAdisoEmpty && (
              <SidebarLauncher onSelect={(seccion) => onSeccionChange?.(seccion)} />
            )}

            {seccionActiva === 'mapa' && (
              <div className="relative min-h-0 flex-1">
                <MapaInteractivo adisos={todosLosAdisos} onAbrirAdiso={handleMapAbrirAdiso} />
              </div>
            )}

            {seccionActiva === 'publicar' && (
              <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
                <PublishSidebarFlow
                  onNotify={(msg, type) => {
                    if (type === 'error') onError?.(msg);
                    else onSuccess?.(msg);
                  }}
                />
              </div>
            )}

            {seccionActiva === 'chatbot' && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <ChatbotIANew
                  onPublicar={onPublicar}
                  onError={onError}
                  onSuccess={onSuccess}
                  onMinimize={handleMinimizarToggle}
                />
              </div>
            )}

            {seccionActiva === 'gratuitos' && (
              <div className="min-h-0 flex-1 overflow-y-auto p-4 text-center text-sm text-[var(--text-secondary)]">
                Usa el menú superior para ver anuncios gratuitos en página completa.
              </div>
            )}

            {seccionActiva === 'negocio' && (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-[var(--text-secondary)]">
                Abre Mi Negocio desde el menú superior.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}
