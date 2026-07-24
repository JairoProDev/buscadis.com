'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Stats {
  totals: {
    requests: number;
    pending: number;
    delivered: number;
    ridersPending: number;
    ridersApproved: number;
  };
  usoDetectado: Record<string, number>;
  zonas: Record<string, number>;
  recent: Array<{
    id: string;
    category: string;
    status: string;
    pickup_zona: string | null;
    fare_estimate: number;
    uso_detectado: string;
    created_at: string;
  }>;
}

export default function AdminEnviosPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/envios/stats', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        setStats(data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold">Admin · Envíos</h1>
          <Link
            href="/admin/envios/riders"
            className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white"
          >
            Cola KYC riders
          </Link>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {!stats && !error && <p className="text-sm">Cargando…</p>}

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ['Solicitudes', stats.totals.requests],
                ['Pendientes', stats.totals.pending],
                ['Entregados', stats.totals.delivered],
                ['Riders OK', stats.totals.ridersApproved],
                ['KYC cola', stats.totals.ridersPending],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-[var(--border-color)] p-3 text-center"
                >
                  <div className="text-2xl font-bold text-[var(--brand-blue)]">{value}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{label}</div>
                </div>
              ))}
            </div>

            <section className="mt-8">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Uso detectado (silencioso)
              </h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.usoDetectado).map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded-full border border-[var(--border-color)] px-3 py-1 text-sm"
                  >
                    {k}: <strong>{v}</strong>
                  </span>
                ))}
                {Object.keys(stats.usoDetectado).length === 0 && (
                  <span className="text-sm text-[var(--text-secondary)]">Sin datos aún</span>
                )}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Zonas calientes
              </h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.zonas)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)] px-3 py-1 text-sm"
                    >
                      {k}: <strong>{v}</strong>
                    </span>
                  ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Recientes
              </h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-3 py-2">Cat</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Zona</th>
                      <th className="px-3 py-2">Uso*</th>
                      <th className="px-3 py-2">Tarifa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((r) => (
                      <tr key={r.id} className="border-t border-[var(--border-color)]">
                        <td className="px-3 py-2">{r.category}</td>
                        <td className="px-3 py-2">{r.status}</td>
                        <td className="px-3 py-2">{r.pickup_zona || '—'}</td>
                        <td className="px-3 py-2">{r.uso_detectado}</td>
                        <td className="px-3 py-2">S/ {r.fare_estimate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                *uso_detectado es interno (no se muestra a usuarios)
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
