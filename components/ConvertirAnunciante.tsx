'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { updateUserRole } from '@/lib/user';
import { IconClose } from './Icons';
import { semantic } from '@/lib/bs-tokens';

interface ConvertirAnuncianteProps {
  abierto: boolean;
  onCerrar: () => void;
  onExito?: () => void;
}

export default function ConvertirAnunciante({ abierto, onCerrar, onExito }: ConvertirAnuncianteProps) {
  const { user, refreshProfile } = useAuth();
  const { profile } = useUser();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto || !user) return null;

  const handleConvertir = async () => {
    if (!user?.id) return;

    setCargando(true);
    setError(null);

    try {
      await updateUserRole(user.id, 'anunciante');
      await refreshProfile();
      onExito?.();
      onCerrar();
    } catch (err: any) {
      setError(err.message || 'Error al convertir en anunciante');
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
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            📢 Convertirse en Anunciante
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

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Beneficios de ser Anunciante:
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <span>✅</span>
              <span>Publica adisos con mayor visibilidad</span>
            </li>
            <li style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <span>✅</span>
              <span>Acceso a estadísticas de tus publicaciones</span>
            </li>
            <li style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <span>✅</span>
              <span>Prioridad en búsquedas y recomendaciones</span>
            </li>
            <li style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <span>✅</span>
              <span>Herramientas avanzadas de gestión</span>
            </li>
            <li style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <span>✅</span>
              <span>Soporte prioritario</span>
            </li>
          </ul>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Al convertirte en anunciante, podrás acceder a todas estas funcionalidades. Es completamente gratuito y puedes revertirlo en cualquier momento desde tu perfil.
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
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
            Cancelar
          </button>
          <button
            onClick={handleConvertir}
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
            {cargando ? 'Convirtiendo...' : 'Convertirme en Anunciante'}
          </button>
        </div>
      </div>
    </div>
  );
}













