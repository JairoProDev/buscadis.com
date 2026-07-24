'use client';

import { IconClose } from '@/components/Icons';
import IdentityKycUploader from '@/components/auth/IdentityKycUploader';

interface VerificationGateModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onContinuar: () => void;
}

/**
 * Hard gate: publish requires photo KYC (pending allows wait message;
 * only approved continues to publish via parent isVerificado).
 */
export default function VerificationGateModal({
  abierto,
  onCerrar,
  onContinuar,
}: VerificationGateModalProps) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Verifica tu identidad</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <IconClose size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Para publicar, crear negocio o ser rider necesitamos fotos de tu DNI y una selfie. Así
          protegemos a la comunidad de fraudes.
        </p>

        <IdentityKycUploader
          allowPendingContinue
          onApprovedOrPending={(status) => {
            if (status === 'approved') onContinuar();
            // pending: stay on gate — user can't publish until approved
          }}
        />

        <button
          type="button"
          onClick={onCerrar}
          className="mt-4 w-full text-sm text-[var(--text-secondary)] hover:underline"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
