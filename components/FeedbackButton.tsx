'use client';

import { useEffect, useRef, useState } from 'react';
import { FaTimes, FaWhatsapp } from 'react-icons/fa';
import { IconClose } from '@/components/Icons';
import { MOTIVOS_AYUDA, getSoporteWhatsAppUrl, type MotivoAyuda } from '@/lib/soporte';

interface FeedbackButtonProps {
  variant?: 'floating';
}

export default function FeedbackButton({ variant = 'floating' }: FeedbackButtonProps) {
  const [abierto, setAbierto] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: 'max(1rem, env(safe-area-inset-bottom))',
        left: 'max(1rem, env(safe-area-inset-left))',
        zIndex: 999,
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

          {MOTIVOS_AYUDA.map((motivo) => (
            <button
              key={motivo.id}
              type="button"
              onClick={() => abrirWhatsApp(motivo.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.15rem',
                padding: '0.75rem 0.85rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
              className="hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30"
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {motivo.label}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {motivo.descripcion}
              </span>
            </button>
          ))}
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
          border: '1px solid rgba(56, 189, 248, 0.35)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: '0 6px 20px rgba(56, 189, 248, 0.25)',
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
