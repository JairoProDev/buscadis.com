'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { crearSolicitudVerificacion } from '@/lib/verification';
import { IconClose } from '@/components/Icons';

interface VerificationGateModalProps {
  abierto: boolean;
  onCerrar: () => void;
  onContinuar: () => void;
}

export default function VerificationGateModal({
  abierto,
  onCerrar,
  onContinuar,
}: VerificationGateModalProps) {
  const { user } = useAuth();
  const [solicitando, setSolicitando] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  if (!abierto) return null;

  const handleSolicitar = async () => {
    if (!user?.id) return;
    setSolicitando(true);
    try {
      await crearSolicitudVerificacion(user.id, 'identidad');
      setSolicitudEnviada(true);
    } catch {
      // Gate suave: permitir continuar aunque falle la solicitud
    } finally {
      setSolicitando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-primary)] p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Verifica tu identidad</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar">
            <IconClose size={20} />
          </button>
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          Para publicar con confianza, verificamos tu identidad. Puedes solicitar verificación ahora o
          publicar y completar el proceso después.
        </p>

        {solicitudEnviada ? (
          <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            Solicitud enviada. Te avisaremos cuando sea revisada.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {!solicitudEnviada && (
            <button
              type="button"
              onClick={handleSolicitar}
              disabled={solicitando}
              className="w-full rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {solicitando ? 'Enviando…' : 'Solicitar verificación'}
            </button>
          )}
          <button
            type="button"
            onClick={onContinuar}
            className="w-full rounded-full border border-[var(--border-color)] py-3 text-sm font-semibold text-[var(--text-primary)]"
          >
            Publicar de todos modos
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="text-sm text-[var(--text-secondary)] hover:underline"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
