'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Adiso } from '@/types';
import { cn } from '@/lib/utils';
import { IconAdiso, IconMap, IconMegaphone, IconChatbot, IconGratuitos, IconMinimize, IconExpand, IconStore } from './Icons';
import ModalAdiso from './ModalAdiso';
import MapaInteractivo from './MapaInteractivo';
import FormularioPublicar from './FormularioPublicar';
import ChatbotIA from './ChatbotIANew';
import AdisosGratuitos from './AdisosGratuitos';
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
  onMinimizadoChange?: (minimizado: boolean) => void;
  todosLosAdisos?: Adiso[];
  minimizado?: boolean;
}

/**
 * Premium Sidebar Panel - Controlled by Header
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
  onMinimizadoChange,
  todosLosAdisos = [],
  minimizado = true
}: SidebarDesktopProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [internalMinimizado, setInternalMinimizado] = useState(minimizado);
  const { setSidebarExpanded, abrirAdiso } = useNavigation();

  // Sync internal minimizado with prop if provided
  useEffect(() => {
    setInternalMinimizado(minimizado);
  }, [minimizado]);

  // Update CSS variable for sidebar width
  useEffect(() => {
    const width = internalMinimizado ? 0 : 420;
    document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
    setSidebarExpanded(!internalMinimizado);
  }, [internalMinimizado, setSidebarExpanded]);

  if (!isDesktop) return null;

  const anchoSidebar = internalMinimizado ? 0 : 420;

  const handleMinimizarToggle = () => {
    const nuevoEstado = !internalMinimizado;
    setInternalMinimizado(nuevoEstado);
    onMinimizadoChange?.(nuevoEstado);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '72px',
        right: 0,
        height: 'calc(100vh - 72px)',
        width: anchoSidebar,
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        borderLeft: 'none',
        boxShadow: internalMinimizado ? 'none' : '-10px 0 30px rgba(0,0,0,0.03)',
        borderTopLeftRadius: '24px',
        borderBottomLeftRadius: '24px',
        overflow: internalMinimizado ? 'visible' : 'hidden',
        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease',
      }}
    >
      {/* Minimize/Expand Button */}
      <motion.button
        onClick={handleMinimizarToggle}
        style={{
          position: 'absolute',
          zIndex: 10,
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-color)',
          cursor: 'pointer',
          top: '20px',
          left: '-36px',
          transform: 'none',
          color: 'var(--text-secondary)',
          transition: 'all 0.2s ease',
        }}
        whileHover={{ scale: 1.1, backgroundColor: 'var(--bg-secondary)' }}
        whileTap={{ scale: 0.95 }}
      >
        {internalMinimizado ? (
          <div style={{ transform: 'rotate(180deg)', display: 'flex' }}>
            <IconMinimize size={16} />
          </div>
        ) : (
          <IconMinimize size={16} />
        )}
      </motion.button>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {!internalMinimizado && (
          <motion.div
            key={seccionActiva}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '0',
              height: '100%',
            }}
          >
            {seccionActiva === 'adiso' && adisoAbierto && (
              <ModalAdiso
                adiso={adisoAbierto}
                onCerrar={onCerrarAdiso}
                onAnterior={onAnterior}
                onSiguiente={onSiguiente}
                puedeAnterior={puedeAnterior}
                puedeSiguiente={puedeSiguiente}
                dentroSidebar={true}
              />
            )}

            {seccionActiva === 'mapa' && (
              <MapaInteractivo
                adisos={todosLosAdisos}
                onAbrirAdiso={(adiso) => {
                  abrirAdiso(adiso.id);
                }}
              />
            )}

            {seccionActiva === 'publicar' && (
              <FormularioPublicar
                onPublicar={onPublicar}
                onCerrar={() => { }} // No closing logic needed here if controlled by header
                onError={onError}
                onSuccess={onSuccess}
                dentroSidebar={true}
              />
            )}

            {seccionActiva === 'gratuitos' && (
              <AdisosGratuitos todosLosAdisos={todosLosAdisos} />
            )}

            {/* Empty State */}
            {seccionActiva === 'adiso' && !adisoAbierto && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                  <IconAdiso size={48} />
                </div>
                <p>Selecciona un adiso para ver los detalles</p>
              </div>
            )}

            {/* Fallback for other sections */}
            {['negocio'].includes(seccionActiva) && (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                Cargando sección...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
