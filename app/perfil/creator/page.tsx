'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { IconInfluencer, IconCopy, IconCheck } from '@/components/Icons';

type CreatorState = {
  handle?: string;
  referral_code?: string;
  bio?: string;
};

export default function CreatorHubPage() {
  const { user, session, loading } = useAuth();
  const { openAuthModal } = useUI();
  const [data, setData] = useState<CreatorState | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      openAuthModal();
      return;
    }
    if (!session?.access_token) return;
    void (async () => {
      const res = await fetch('/api/capabilities/activate', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      const inf = (json.capabilities || []).find((c: { capability: string }) => c.capability === 'influencer');
      if (inf?.meta) {
        setData({
          handle: inf.meta.handle,
          referral_code: inf.meta.referral_code,
        });
      }
    })();
  }, [user, session?.access_token, loading, openAuthModal]);

  const activate = async () => {
    if (!session?.access_token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/capabilities/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ capability: 'influencer', handle: handle || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo activar');
        return;
      }
      const inf = (json.capabilities || []).find((c: { capability: string }) => c.capability === 'influencer');
      setData({
        handle: inf?.meta?.handle || handle,
        referral_code: inf?.meta?.referral_code,
      });
    } catch {
      setError('Error de red');
    } finally {
      setBusy(false);
    }
  };

  const shareUrl =
    typeof window !== 'undefined' && data?.referral_code
      ? `${window.location.origin}/?ref=${data.referral_code}`
      : data?.referral_code
        ? `https://www.buscadis.com/?ref=${data.referral_code}`
        : '';

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!user && !loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[var(--text-secondary)]">Entra para activar tu perfil de influencer.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--brand-primary-rgb),0.12)] text-[var(--brand-blue)]">
          <IconInfluencer size={32} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Influencer / referidos</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Comparte tu enlace, crea UGC y gana con el programa de afiliados (pagos en una siguiente fase).
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!data?.referral_code ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
          <label className="text-sm text-[var(--text-secondary)]">Tu handle (opcional)</label>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
            placeholder="tunombre"
            className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void activate()}
            className="mt-3 w-full rounded-xl bg-[var(--text-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-primary)]"
          >
            {busy ? 'Activando…' : 'Activar perfil creator'}
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
          <p className="text-sm text-[var(--text-primary)]">
            Handle: <strong>@{data.handle}</strong>
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Código: <strong>{data.referral_code}</strong>
          </p>
          <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] px-3 py-2">
            <code className="flex-1 truncate text-xs text-[var(--text-primary)]">{shareUrl}</code>
            <button type="button" onClick={() => void copy()} className="shrink-0 p-1 text-[var(--brand-blue)]" aria-label="Copiar">
              {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Quien entre con tu enlace queda atribuido. Las liquidaciones de comisión se habilitarán después.
          </p>
        </div>
      )}

      <Link href="/perfil" className="inline-block text-sm text-[var(--brand-blue)] underline">
        ← Volver al perfil
      </Link>
    </div>
  );
}
