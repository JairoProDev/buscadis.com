'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { signUp, signIn, signInWithOAuth, signInWithMagicLink } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent } from '@/lib/events/track';
import { IconClose, IconGoogle, IconFacebook } from './Icons';

interface AuthModalProps {
  abierto: boolean;
  onCerrar: () => void;
  modoInicial?: 'login' | 'signup';
}

export default function AuthModal({ abierto, onCerrar, modoInicial = 'signup' }: AuthModalProps) {
  const [modo, setModo] = useState<'login' | 'signup' | 'reset'>(modoInicial);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { refreshProfile } = useAuth();

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setCargando(true);

    try {
      if (modo === 'signup') {
        const { user, error: signUpError } = await signUp({
          email,
          password,
          nombre,
          apellido
        });

        if (signUpError) {
          setError(signUpError.message || 'Error al registrarse');
          return;
        }

        if (user) {
          trackEvent('auth.sign_up', {
            entityType: 'auth',
            entityId: user.id,
            payload: { method: 'email' },
          });
          setMensaje('¡Registro exitoso! Revisa tu email para confirmar tu cuenta. El modal se cerrará automáticamente en 5 segundos.');
          // No cerrar inmediatamente, dar tiempo para leer el mensaje
          setTimeout(() => {
            onCerrar();
            refreshProfile();
          }, 5000);
        }
      } else if (modo === 'login') {
        const { user, error: signInError } = await signIn({ email, password });

        if (signInError) {
          // Manejar error de email no confirmado
          if (signInError.message?.includes('email') || signInError.message?.includes('confirm')) {
            setError('Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
          } else {
            setError(signInError.message || 'Error al iniciar sesión');
          }
          return;
        }

        if (user) {
          // Verificar si el email está confirmado
          if (!user.email_confirmed_at) {
            setError('Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
            return;
          }
          onCerrar();
          refreshProfile();
        }
      } else if (modo === 'reset') {
        const { error: resetError } = await signInWithMagicLink(email);

        if (resetError) {
          setError(resetError.message || 'Error al enviar email');
          return;
        }

        setMensaje('Revisa tu email para el enlace de recuperación de contraseña.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setCargando(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setError(null);
    setCargando(true);

    try {
      const { error: oauthError } = await signInWithOAuth(provider);
      if (oauthError) {
        setError(oauthError.message || `Error al iniciar sesión con ${provider}`);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setCargando(false);
    }
  };

  // Use portal to escape parent stacking context
  if (typeof document !== 'undefined') {
    return createPortal(
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '1rem',
          overflowY: 'auto'
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
            maxHeight: 'none',
            margin: 'auto',
            position: 'relative',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {modo === 'login' ? 'Iniciar Sesión' : modo === 'signup' ? 'Registrarse' : 'Recuperar Contraseña'}
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

          {/* Mensajes de error/éxito */}
          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#ef4444',
                fontSize: '0.875rem',
                marginBottom: '1rem'
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
                marginBottom: '1rem'
              }}
            >
              {mensaje}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            {modo === 'signup' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Apellido (opcional)
                  </label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {modo !== 'reset' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: cargando ? 'var(--text-tertiary)' : 'var(--text-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: cargando ? 'not-allowed' : 'pointer',
                marginBottom: '1rem'
              }}
            >
              {cargando
                ? 'Cargando...'
                : modo === 'login'
                  ? 'Iniciar Sesión'
                  : modo === 'signup'
                    ? 'Registrarse'
                    : 'Enviar Email'}
            </button>
          </form>

          {/* OAuth Buttons */}
          {/* OAuth Buttons */}
          {(modo === 'login' || modo === 'signup') && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={cargando}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#fff',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    cursor: cargando ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                >
                  <IconGoogle size={20} />
                  <span>{modo === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Links de cambio de modo */}
          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {modo === 'login' ? (
              <>
                <button
                  type="button"
                  onClick={() => setModo('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    marginRight: '0.5rem'
                  }}
                >
                  ¿No tienes cuenta? Regístrate
                </button>
                <br style={{ margin: '0.5rem 0' }} />
                <button
                  type="button"
                  onClick={() => setModo('reset')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            ) : modo === 'signup' ? (
              <button
                type="button"
                onClick={() => setModo('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModo('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Volver a iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  } else {
    return null;
  }
}

