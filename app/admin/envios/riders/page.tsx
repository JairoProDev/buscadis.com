'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { MOTO_DOC_LABELS, type MotoDocType } from '@/lib/envios';

interface RiderDoc {
  tipo: MotoDocType;
  preview_url: string;
  url: string;
}

interface RiderRow {
  id: string;
  display_name: string | null;
  telefono_whatsapp: string | null;
  placa: string | null;
  zonas: string[];
  estado: string;
  admin_note: string | null;
  created_at: string;
  docs: RiderDoc[];
}

export default function AdminEnviosRidersPage() {
  const [riders, setRiders] = useState<RiderRow[]>([]);
  const [estado, setEstado] = useState('pendiente');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/envios/riders?estado=${estado}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setRiders(data.riders || []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [estado]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (riderId: string, action: 'aprobar' | 'rechazar' | 'suspender') => {
    setBusy(riderId);
    try {
      const res = await fetch('/api/admin/envios/riders', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rider_id: riderId,
          action,
          note: note[riderId] || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(null);
    }
  };

  const dniSelfie = (docs: RiderDoc[]) => {
    const frente = docs.find((d) => d.tipo === 'dni_frente');
    const selfie = docs.find((d) => d.tipo === 'selfie');
    return { frente, selfie };
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Admin · Envíos KYC</h1>
            <Link href="/admin/envios" className="text-sm text-[var(--brand-blue)]">
              ← Métricas
            </Link>
          </div>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm"
          >
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
            <option value="borrador">Borradores</option>
            <option value="suspendido">Suspendidos</option>
          </select>
        </div>

        {loading && <p className="text-sm">Cargando…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-6">
          {riders.map((r) => {
            const { frente, selfie } = dniSelfie(r.docs || []);
            return (
              <article
                key={r.id}
                className="rounded-2xl border border-[var(--border-color)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{r.display_name || 'Sin nombre'}</h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {r.telefono_whatsapp} · Placa {r.placa} ·{' '}
                      {(r.zonas || []).join(', ')}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--hover-bg)] px-2 py-1 text-xs">
                    {r.estado}
                  </span>
                </div>

                {/* Comparación visual DNI | selfie */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-xs font-medium">DNI frente</p>
                    {frente?.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={frente.preview_url}
                        alt="DNI"
                        className="h-40 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
                        Sin DNI
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium">Selfie</p>
                    {selfie?.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selfie.preview_url}
                        alt="Selfie"
                        className="h-40 w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
                        Sin selfie
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(r.docs || []).map((d) => (
                    <a
                      key={d.tipo}
                      href={d.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-[var(--border-color)] px-2.5 py-1 text-xs"
                    >
                      {MOTO_DOC_LABELS[d.tipo] || d.tipo}
                    </a>
                  ))}
                </div>

                <textarea
                  value={note[r.id] || ''}
                  onChange={(e) =>
                    setNote((n) => ({ ...n, [r.id]: e.target.value }))
                  }
                  placeholder="Nota (opcional, se envía al rechazar)"
                  rows={2}
                  className="mt-3 w-full rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {estado === 'pendiente' && (
                    <>
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => void act(r.id, 'aprobar')}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => void act(r.id, 'rechazar')}
                        className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {estado === 'aprobado' && (
                    <button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => void act(r.id, 'suspender')}
                      className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-600"
                    >
                      Suspender
                    </button>
                  )}
                </div>
              </article>
            );
          })}

          {!loading && riders.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">
              No hay riders en estado “{estado}”.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
