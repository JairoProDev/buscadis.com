'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { IDENTITY_DOC_LABELS, type IdentityDocType } from '@/lib/auth/identity-kyc';

type Doc = { tipo: IdentityDocType; preview_url: string };

type Row = {
  id: string;
  email?: string;
  nombre?: string;
  apellido?: string;
  dni?: string;
  whatsapp?: string;
  name_match_score?: number;
  identity_kyc_submitted_at?: string;
  google_profile?: { name?: string; picture?: string };
  docs: Doc[];
};

export default function AdminIdentityKycPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/identity-kyc?status=${status}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error');
        setRows([]);
        return;
      }
      setRows(data.rows || []);
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (userId: string, action: 'approve' | 'reject') => {
    setBusy(userId);
    try {
      const res = await fetch('/api/admin/identity-kyc', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action,
          reason: reason[userId],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo actualizar');
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Header />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">KYC identidad</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Revisa DNI + selfie. Compara con nombre Google / padrón.
            </p>
          </div>
          <Link href="/admin/envios/riders" className="text-sm text-[var(--brand-blue)] underline">
            Riders KYC
          </Link>
        </div>

        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                status === s
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                  : 'border border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading && <p className="text-sm text-[var(--text-secondary)]">Cargando…</p>}

        <div className="space-y-4">
          {rows.map((r) => {
            const gpName = r.google_profile?.name;
            const padron = `${r.nombre || ''} ${r.apellido || ''}`.trim();
            return (
              <article
                key={r.id}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{padron || '—'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      DNI {r.dni} · {r.email} · WA {r.whatsapp || '—'}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Google: {gpName || '—'} · match {(r.name_match_score ?? 0).toFixed(2)}
                      {(r.name_match_score ?? 1) < 0.35 ? ' ⚠ bajo' : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {r.docs.map((d) => (
                    <a
                      key={d.tipo}
                      href={d.preview_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border border-[var(--border-color)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.preview_url} alt={d.tipo} className="aspect-[3/4] w-full object-cover" />
                      <span className="block bg-[var(--bg-secondary)] px-1 py-0.5 text-center text-[10px]">
                        {IDENTITY_DOC_LABELS[d.tipo]}
                      </span>
                    </a>
                  ))}
                </div>

                {status === 'pending' && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      placeholder="Motivo si rechazas"
                      value={reason[r.id] || ''}
                      onChange={(e) => setReason((m) => ({ ...m, [r.id]: e.target.value }))}
                      className="flex-1 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => void act(r.id, 'approve')}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => void act(r.id, 'reject')}
                      className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </article>
            );
          })}
          {!loading && rows.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">No hay solicitudes en este estado.</p>
          )}
        </div>
      </main>
    </div>
  );
}
