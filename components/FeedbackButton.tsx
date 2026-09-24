'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { FaTimes, FaWhatsapp } from 'react-icons/fa';
import {
  IconAlertTriangle,
  IconClose,
  IconLightbulb,
  IconMegaphone,
  IconSearch,
} from '@/components/Icons';
import { MOTIVOS_AYUDA, getSoporteWhatsAppUrl, type MotivoAyuda } from '@/lib/soporte';
import { MOTIVO_AYUDA_VISUAL } from '@/lib/soporte-ui';
import { useUI } from '@/contexts/UIContext';

const MOTIVO_ICON: Record<MotivoAyuda, ComponentType<{ size?: number; color?: string }>> = {
  duda: IconSearch,
  publicar: IconMegaphone,
  sugerencia: IconLightbulb,
  problema: IconAlertTriangle,
};

interface FeedbackButtonProps {
  variant?: 'floating';
}

export default function FeedbackButton({ variant = 'floating' }: FeedbackButtonProps) {
  const [abierto, setAbierto] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { isAuthModalOpen } = useUI();

  useEffect(() => {
    if (!abierto) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [abierto]);

  const abrirWhatsApp = (motivo: MotivoAyuda) => {
    window.open(getSoporteWhatsAppUrl(motivo), '_blank', 'noopener,noreferrer');
    setAbierto(false);
  };

  if (variant !== 'floating') return null;
  if (isAuthModalOpen) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--bs-nav-visible-offset, calc(var(--bs-nav-height, 56px) + env(safe-area-inset-bottom, 0px))) + 0.75rem)',
        left: 'max(1rem, env(safe-area-inset-left))',
        zIndex: 1600,
        transition: 'bottom 0.28s ease-out',
      }}
    >
      {abierto && (
        <div
          role="dialog"
          aria-label="Opciones de ayuda"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: 0,
            width: 'min(300px, calc(100vw - 2rem))',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.35rem 0.5rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ¿En qué te ayudamos?
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Te atendemos por WhatsApp
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar menú de ayuda"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              <IconClose size={14} />
            </button>
          </div>

          {MOTIVOS_AYUDA.map((motivo) => {
            const visual = MOTIVO_AYUDA_VISUAL[motivo.id];
            const Icon = MOTIVO_ICON[motivo.id];
            return (
              <button
                key={motivo.id}
                type="button"
                onClick={() => abrirWhatsApp(motivo.id)}
                className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 text-left transition-colors hover:bg-[var(--hover-bg)]"
                style={{ ['--motivo-hover-border' as string]: visual.hoverBorder }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = visual.hoverBorder;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: visual.iconBg }}
                  aria-hidden
                >
                  <Icon size={18} color={visual.iconColor} />
                </span>
                <span className="min-w-0 flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{motivo.label}</span>
                  <span className="text-xs leading-snug text-[var(--text-secondary)]">{motivo.descripcion}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        style={{
          padding: '0.7rem 1rem',
          borderRadius: '999px',
          border: '1px solid color-mix(in srgb, var(--brand-blue) 35%, transparent)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: '0 6px 20px color-mix(in srgb, var(--brand-blue) 28%, transparent)',
          backgroundColor: 'var(--brand-blue)',
          color: '#fff',
        }}
        className="motion-reduce:transform-none hover:-translate-y-0.5"
      >
        <FaWhatsapp size={16} aria-hidden="true" />
        Ayuda
        {abierto ? <FaTimes size={12} aria-hidden="true" /> : null}
      </button>
    </div>
  );
}
