'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  IDENTITY_DOC_LABELS,
  IDENTITY_DOC_TYPES,
  type IdentityDocType,
  type IdentityKycStatus,
} from '@/lib/auth/identity-kyc';
import { IconCamera, IconCheck, IconShield } from '@/components/Icons';

type Props = {
  /** Compact embed (onboarding / gate) */
  onApprovedOrPending?: (status: IdentityKycStatus) => void;
  /** Require approved before calling onDone; pending also allowed to continue waiting */
  allowPendingContinue?: boolean;
};

export default function IdentityKycUploader({ onApprovedOrPending, allowPendingContinue }: Props) {
  const { session, profile, refreshProfile } = useAuth();
  const [status, setStatus] = useState<IdentityKycStatus>('none');
  const [uploaded, setUploaded] = useState<Partial<Record<IdentityDocType, boolean>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [nameWarn, setNameWarn] = useState(false);
  const fileRefs = useRef<Partial<Record<IdentityDocType, HTMLInputElement | null>>>({});

  const headers = useCallback((): HeadersInit => {
    const h: Record<string, string> = {};
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  }, [session?.access_token]);

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    const res = await fetch('/api/identity/kyc/docs', { headers: headers(), credentials: 'include' });
    const json = await res.json();
    if (!res.ok) return;
    setStatus((json.status as IdentityKycStatus) || 'none');
    setRejection(json.rejection_reason || null);
    const map: Partial<Record<IdentityDocType, boolean>> = {};
    for (const d of json.docs || []) map[d.tipo as IdentityDocType] = true;
    setUploaded(map);
  }, [session?.access_token, headers]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (profile?.identity_kyc_status) {
      setStatus(profile.identity_kyc_status as IdentityKycStatus);
    }
  }, [profile?.identity_kyc_status]);

  const upload = async (tipo: IdentityDocType, file: File) => {
    setBusy(tipo);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('tipo', tipo);
      fd.set('file', file);
      const res = await fetch('/api/identity/kyc/docs', {
        method: 'POST',
        headers: headers(),
        credentials: 'include',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo subir');
        return;
      }
      setUploaded((u) => ({ ...u, [tipo]: true }));
    } catch {
      setError('Error de red al subir');
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    setBusy('submit');
    setError(null);
    try {
      const res = await fetch('/api/identity/kyc/submit', {
        method: 'POST',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo enviar');
        return;
      }
      setStatus('pending');
      setNameWarn(Boolean(json.name_match_warning));
      await refreshProfile();
      onApprovedOrPending?.('pending');
    } catch {
      setError('Error al enviar a revisión');
    } finally {
      setBusy(null);
    }
  };

  if (status === 'approved') {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
        <div className="flex items-center gap-2 font-semibold">
          <IconShield size={20} /> Identidad verificada
        </div>
        <p className="mt-1 text-xs opacity-80">Ya puedes publicar, crear negocio o ser rider.</p>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
        <div className="flex items-center gap-2 font-semibold">
          <IconShield size={20} /> En revisión
        </div>
        <p className="mt-1 text-xs opacity-90">
          Revisaremos tu DNI y selfie. Te avisamos cuando esté listo.
          {nameWarn ? ' (El nombre de Google no coincide del todo con el DNI — un humano lo revisará.)' : ''}
        </p>
        {allowPendingContinue && (
          <button
            type="button"
            onClick={() => onApprovedOrPending?.('pending')}
            className="mt-3 text-xs font-semibold underline"
          >
            Continuar
          </button>
        )}
      </div>
    );
  }

  const allUploaded = IDENTITY_DOC_TYPES.every((t) => uploaded[t]);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(var(--brand-primary-rgb),0.12)] text-[var(--brand-blue)]">
          <IconShield size={24} />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Prueba que eres tú</p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Sube fotos claras del DNI (frente y reverso) y una selfie sosteniendo el DNI. Así evitamos
            documentos robados o inventados.
          </p>
        </div>
      </div>

      {rejection && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">
          Rechazado: {rejection}. Sube de nuevo y reenvía.
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid gap-2">
        {IDENTITY_DOC_TYPES.map((tipo) => (
          <div
            key={tipo}
            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-color)] px-3 py-2.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <IconCamera size={18} color="var(--text-secondary)" />
              <span className="text-sm text-[var(--text-primary)]">{IDENTITY_DOC_LABELS[tipo]}</span>
              {uploaded[tipo] && <IconCheck size={14} color="#16a34a" />}
            </div>
            <div>
              <input
                ref={(el) => {
                  fileRefs.current[tipo] = el;
                }}
                type="file"
                accept="image/*"
                capture={tipo === 'selfie' ? 'user' : 'environment'}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(tipo, f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={busy === tipo}
                onClick={() => fileRefs.current[tipo]?.click()}
                className="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]"
              >
                {busy === tipo ? '…' : uploaded[tipo] ? 'Cambiar' : 'Subir'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={!allUploaded || busy === 'submit'}
        onClick={() => void submit()}
        className="w-full rounded-xl bg-[var(--text-primary)] py-2.5 text-sm font-semibold text-[var(--bg-primary)] disabled:opacity-40"
      >
        {busy === 'submit' ? 'Enviando…' : 'Enviar a verificación'}
      </button>
    </div>
  );
}
