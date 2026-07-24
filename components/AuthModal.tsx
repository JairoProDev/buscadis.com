'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { signIn, signInWithMagicLink } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { IconClose } from './Icons';
import GoogleGisButton from '@/components/auth/GoogleGisButton';

interface AuthModalProps {
  abierto: boolean;
  onCerrar: () => void;
  modoInicial?: 'login' | 'signup';
}

export default function AuthModal({ abierto, onCerrar, modoInicial = 'signup' }: AuthModalProps) {
  const [modo, setModo] = useState<'login' | 'signup' | 'legacy'>(modoInicial === 'login' ? 'login' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (abierto) {
      setModo(modoInicial === 'login' ? 'login' : 'signup');
      setError(null);
      setMensaje(null);
    }
  }, [abierto, modoInicial]);

  if (!abierto || typeof document === 'undefined') return null;

  const handleLegacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setCargando(true);
    try {
      if (modo === 'legacy') {
        const { user, error: signInError } = await signIn({ email, password });
        if (signInError) {
          setError(signInError.message || 'No se pudo entrar');
          return;
        }
        if (user) {
          onCerrar();
          await refreshProfile();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    setMensaje(null);
    if (!email.trim()) {
      setError('Escribe tu email');
      return;
    }
    setCargando(true);
    try {
      const { error: magicError } = await signInWithMagicLink(email.trim());
      if (magicError) {
        setError(magicError.message || 'No se pudo enviar el enlace');
        return;
      }
      setMensaje('Te enviamos un enlace a tu email. También puedes usar Google (más rápido).');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setCargando(false);
    }
  };

  const title =
    modo === 'login' || modo === 'legacy'
      ? 'Entrar con mi cuenta'
      : 'Crear cuenta';

  const subtitle =
    modo === 'signup'
      ? 'En un clic con Google. Luego te pedimos DNI y WhatsApp para tu seguridad.'
      : 'Entra con Google. Es la forma más rápida y segura.';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '1rem',
        overflowY: 'auto',
      }}
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '12px',
          padding: '1.75rem',
          maxWidth: '400px',
          width: '100%',
          margin: 'auto',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 id="auth-modal-title" style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h2>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.35rem',
            }}
          >
            <IconClose size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {mensaje && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '6px',
              color: '#22c55e',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {mensaje}
          </div>
        )}

        {modo !== 'legacy' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <GoogleGisButton
              label={modo === 'signup' ? 'Crear cuenta con Google' : 'Entrar con Google'}
              disabled={cargando}
              onSuccess={async () => {
                onCerrar();
                await refreshProfile();
              }}
              onError={(msg) => setError(msg)}
            />
          </div>
        )}

        {modo === 'legacy' && (
          <form onSubmit={handleLegacySubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={cargando} style={primaryBtn(cargando)}>
              {cargando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          {modo === 'signup' ? (
            <button type="button" onClick={() => setModo('login')} style={linkBtn}>
              ¿Ya tienes cuenta? Entrar con mi cuenta
            </button>
          ) : modo === 'login' ? (
            <>
              <button type="button" onClick={() => setModo('signup')} style={linkBtn}>
                ¿No tienes cuenta? Crear cuenta
              </button>
              <div style={{ marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setModo('legacy')} style={{ ...linkBtn, color: 'var(--text-secondary)' }}>
                  Usar email y contraseña (cuenta anterior)
                </button>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="Email para enlace mágico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...inputStyle, maxWidth: 200, padding: '0.4rem 0.5rem' }}
                />
                <button type="button" onClick={handleMagicLink} disabled={cargando} style={linkBtn}>
                  Enviar enlace
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setModo('login')} style={linkBtn}>
              Volver a Google
            </button>
          )}
        </div>

        <p
          style={{
            marginTop: '1.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary, var(--text-secondary))',
            lineHeight: 1.45,
            textAlign: 'center',
          }}
        >
          Verificamos identidad (DNI) y WhatsApp para protegerte de fraudes.
        </p>
      </div>
    </div>,
    document.body
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  fontSize: '0.875rem',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
};

const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  textDecoration: 'underline',
  fontSize: '0.875rem',
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
    color: 'var(--bg-primary)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
