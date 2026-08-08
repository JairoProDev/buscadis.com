'use client';

import React, { useEffect, useState } from 'react';
import { signIn, signInWithMagicLink } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from '@buscadis/ui';
import GoogleGisButton from '@/components/auth/GoogleGisButton';

interface AuthModalProps {
  abierto: boolean;
  onCerrar: () => void;
  modoInicial?: 'login' | 'signup';
}

export default function AuthModal({ abierto, onCerrar, modoInicial = 'signup' }: AuthModalProps) {
  const [modo, setModo] = useState<'login' | 'signup' | 'legacy'>(
    modoInicial === 'login' ? 'login' : 'signup'
  );
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
    modo === 'login' || modo === 'legacy' ? 'Entrar con mi cuenta' : 'Crear cuenta';

  const subtitle =
    modo === 'signup'
      ? 'En un clic con Google. Luego te pedimos DNI y WhatsApp para tu seguridad.'
      : 'Entra con Google. Es la forma más rápida y segura.';

  return (
    <Modal open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <ModalContent size="sm" aria-describedby="auth-modal-desc">
        <ModalHeader>
          <ModalTitle id="auth-modal-title">{title}</ModalTitle>
          <ModalDescription id="auth-modal-desc">{subtitle}</ModalDescription>
        </ModalHeader>
        <ModalBody className="pb-6">
          {error && (
            <div
              className="mb-4 rounded-[var(--bs-radius-xs)] border border-[var(--bs-danger-fg)]/30 bg-[var(--bs-danger-bg)] p-3 text-sm text-[var(--bs-danger-fg)]"
              role="alert"
            >
              {error}
            </div>
          )}

          {mensaje && (
            <div
              className="mb-4 rounded-[var(--bs-radius-xs)] border border-[var(--bs-success-fg)]/30 bg-[var(--bs-success-bg)] p-3 text-sm text-[var(--bs-success-fg)]"
              role="status"
            >
              {mensaje}
            </div>
          )}

          {modo !== 'legacy' && (
            <div className="mb-5">
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
            <form onSubmit={handleLegacySubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="auth-email" className="mb-2 block text-sm text-[var(--bs-fg-muted)]">
                  Email
                </label>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  error={Boolean(error)}
                />
              </div>
              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-2 block text-sm text-[var(--bs-fg-muted)]"
                >
                  Contraseña
                </label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" variant="primary" fullWidth loading={cargando}>
                Entrar
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm text-[var(--bs-fg-muted)]">
            {modo === 'signup' ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setModo('login')}>
                ¿Ya tienes cuenta? Entrar con mi cuenta
              </Button>
            ) : modo === 'login' ? (
              <>
                <Button type="button" variant="ghost" size="sm" onClick={() => setModo('signup')}>
                  ¿No tienes cuenta? Crear cuenta
                </Button>
                <div className="mt-3">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setModo('legacy')}>
                    Usar email y contraseña (cuenta anterior)
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  <Input
                    type="email"
                    placeholder="Email para enlace mágico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="max-w-[200px]"
                    aria-label="Email para enlace mágico"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleMagicLink}
                    loading={cargando}
                  >
                    Enviar enlace
                  </Button>
                </div>
              </>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={() => setModo('login')}>
                Volver a Google
              </Button>
            )}
          </div>

          <p className="mt-5 mb-0 text-center text-xs leading-snug text-[var(--bs-fg-subtle)]">
            Verificamos identidad (DNI) y WhatsApp para protegerte de fraudes.
          </p>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
