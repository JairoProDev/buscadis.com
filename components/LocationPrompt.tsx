'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { requestAndSaveLocation, isGeolocationSupported } from '@/lib/location';
import { IconClose } from './Icons';
import { bsMix, semantic } from '@/lib/bs-tokens';

interface LocationPromptProps {
  abierto: boolean;
  onCerrar: () => void;
  onAceptar?: () => void;
}

export default function LocationPrompt({ abierto, onCerrar, onAceptar }: LocationPromptProps) {
  const { user } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto || !user) return null;

  const handleAceptar = async () => {
    if (!isGeolocationSupported()) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      await requestAndSaveLocation(user.id);
      onAceptar?.();
      onCerrar();
    } catch (err: any) {
      setError(err.message || 'Error al obtener ubicación');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: '1rem'
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            📍 Compartir Ubicación
          </h2>
          <button
            onClick={onCerrar}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Cerrar"
          >
            <IconClose size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Para mostrarte adisos relevantes cerca de ti, necesitamos tu ubicación. Tu ubicación se guardará de forma segura y solo se usará para personalizar tu experiencia.
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: bsMix('--bs-danger-fg', 10),
              border: `1px solid ${bsMix('--bs-danger-fg', 30)}`,
              borderRadius: '6px',
              color: semantic.dangerFg,
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCerrar}
            disabled={cargando}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: cargando ? 'not-allowed' : 'pointer'
            }}
          >
            Ahora no
          </button>
          <button
            onClick={handleAceptar}
            disabled={cargando}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: cargando ? 'var(--text-tertiary)' : 'var(--text-primary)',
              color: 'var(--bg-primary)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: cargando ? 'not-allowed' : 'pointer'
            }}
          >
            {cargando ? 'Obteniendo...' : 'Compartir ubicación'}
          </button>
        </div>
      </div>
    </div>
  );
}













