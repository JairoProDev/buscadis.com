'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@buscadis/ui';
import GoogleGisButton from '@/components/auth/GoogleGisButton';

interface AuthModalProps {
  abierto: boolean;
  onCerrar: (options?: { dismissed?: boolean }) => void;
  modoInicial?: 'login' | 'signup';
}

/** Respaldo mínimo si el prompt nativo de Google no aparece en este dispositivo. */
export default function AuthModal({ abierto, onCerrar }: AuthModalProps) {
  const [error, setError] = useState<string | null>(null);
  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (!abierto) {
      setError(null);
    }
  }, [abierto]);

  return (
    <Modal
      open={abierto}
      onOpenChange={(open) => {
        if (!open) onCerrar({ dismissed: true });
      }}
    >
      <ModalContent
        size="sm"
        className="max-md:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <ModalHeader className="pb-2">
          <ModalTitle id="auth-modal-title">Iniciar sesión en Buscadis</ModalTitle>
        </ModalHeader>
        <ModalBody className="pb-6 pt-0">
          {error && (
            <div
              className="mb-4 rounded-[var(--bs-radius-xs)] border border-[var(--bs-danger-fg)]/30 bg-[var(--bs-danger-bg)] p-3 text-sm text-[var(--bs-danger-fg)]"
              role="alert"
            >
              {error}
            </div>
          )}

          <GoogleGisButton
            label="Continuar con Google"
            onSuccess={async () => {
              onCerrar();
              await refreshProfile();
            }}
            onError={(msg) => setError(msg)}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
