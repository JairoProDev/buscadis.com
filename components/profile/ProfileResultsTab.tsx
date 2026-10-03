'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AdisoMetricsSummary } from '@/lib/analytics/adiso-metrics';

type Period = 7 | 30;

interface ProfileResultsTabProps {
  accessToken?: string | null;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default function ProfileResultsTab({ accessToken }: ProfileResultsTabProps) {
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<AdisoMetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/adisos/analytics?days=${period}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json as AdisoMetricsSummary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las métricas');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportUrl = `/api/me/adisos/analytics/export?days=${period}`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Resultados de tus anuncios</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Impresiones, clics y contactos medidos en Buscadis (últimos {period} días). Útil para
              decidir si promocionar o renovar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([7, 30] as Period[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPeriod(d)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  period === d
                    ? 'bg-[var(--brand-blue)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {d}d
              </button>
            ))}
            {accessToken && (
              <a
                href={exportUrl}
                className="rounded-full border border-[var(--border-color)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                onClick={(e) => {
                  e.preventDefault();
                  fetch(exportUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: 'include',
                  })
                    .then((r) => r.blob())
                    .then((blob) => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `buscadis-resultados-${period}d.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    })
                    .catch(() => setError('No se pudo exportar CSV'));
                }}
              >
                Exportar CSV
              </a>
            )}
          </div>
        </div>

        {loading && (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Cargando métricas…</p>
        )}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {data && !loading && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Impresiones', value: data.totals.impressions },
                { label: 'Clics', value: data.totals.clicks },
                { label: 'Contactos', value: data.totals.contacts },
                { label: 'Guardados', value: data.totals.favorites },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl bg-[var(--bg-secondary)] px-3 py-3 text-center"
                >
                  <p className="text-xl font-bold text-[var(--text-primary)]">{c.value}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
                    {c.label}
                  </p>
                </div>
              ))}
            </div>

            {data.adisos.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Aún no tienes anuncios publicados.{' '}
                <Link href="/publicar" className="font-medium text-[var(--brand-blue)]">
                  Publicar ahora
                </Link>
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--border-color)]">
                {data.adisos.map((row) => (
                  <li key={row.adisoId} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--text-primary)]">{row.titulo}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {row.categoria || 'Sin categoría'}
                        {!row.estaActivo && ' · pausado'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                      <span title="Veces que apareció en el feed">
                        <strong className="text-[var(--text-primary)]">{row.impressions}</strong> imp.
                      </span>
                      <span>
                        <strong className="text-[var(--text-primary)]">{row.clicks}</strong> clics
                      </span>
                      <span>
                        <strong className="text-[var(--text-primary)]">{row.contacts}</strong> contactos
                      </span>
                      <span>CTR {pct(row.ctr)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-[var(--text-tertiary)]">
        ¿Tienes vitrina de negocio? En{' '}
        <Link href="/mi-negocio" className="text-[var(--brand-blue)]">Mi negocio</Link> verás visitas,
        pedidos y QR en el panel de analytics del perfil.
      </p>
    </div>
  );
}
