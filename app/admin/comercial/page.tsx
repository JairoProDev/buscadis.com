'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  backfillPaidClientsApi,
  backfillRuedaApi,
  fetchOpportunities,
  fetchPipeline,
  patchOpportunityApi,
} from '@/lib/comercial/client';
import type { SalesOpportunityWithAdiso, SalesStage } from '@/lib/comercial/types';
import { CAMPANA_RUEDA_OCT_2026 } from '@/lib/comercial/campana-rueda-oct-2026';
import { RUEDA_R2764_BATCH_ID } from '@/lib/rueda/batch-constants';

export default function AdminComercialPage() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [stages, setStages] = useState<SalesStage[]>([]);
  const [opportunities, setOpportunities] = useState<SalesOpportunityWithAdiso[]>([]);
  const [metrics, setMetrics] = useState<{
    totals: { open: number; won: number; lost: number; amountWonPen: number };
    conversion: { wonRate: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<string>('campana');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [pipe, opps] = await Promise.all([
        fetchPipeline(token),
        fetchOpportunities(
          token,
          filterMode === 'campana'
            ? { campaign: CAMPANA_RUEDA_OCT_2026 }
            : filterMode === 'rueda'
              ? { source: 'rueda' }
              : filterMode === 'cliente'
                ? { source: 'cliente_existente' }
                : undefined,
        ),
      ]);
      setStages(pipe.stages);
      setMetrics(pipe.metrics);
      setOpportunities(opps.opportunities);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [token, filterMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const byStage = useMemo(() => {
    const map = new Map<string, SalesOpportunityWithAdiso[]>();
    for (const s of stages) map.set(s.id, []);
    for (const o of opportunities) {
      const list = map.get(o.stage_id) || [];
      list.push(o);
      map.set(o.stage_id, list);
    }
    return map;
  }, [stages, opportunities]);

  const moveStage = async (id: string, stageId: string) => {
    if (!token) return;
    await patchOpportunityApi(token, id, { stage_id: stageId });
    await load();
  };

  const runBackfill = async () => {
    if (!token) return;
    setError(null);
    try {
      const r = await backfillRuedaApi(token, RUEDA_R2764_BATCH_ID);
      alert(`Rueda: ${r.created} creadas, ${r.skipped} omitidas`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Backfill falló');
    }
  };

  const runPaidSync = async () => {
    if (!token) return;
    setError(null);
    try {
      const r = await backfillPaidClientsApi(token);
      alert(`Clientes pagados: ${r.synced} sincronizados`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync clientes falló');
    }
  };

  if (!token) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-[var(--text-secondary)]">Inicia sesión como admin de plataforma.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Comercial</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Campaña WA contactados (~60) · filtro «Leads PDF» = ~340 sin contactar masivo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
          >
            <option value="campana">Campaña Rueda (contactados)</option>
            <option value="">Todas</option>
            <option value="rueda">Leads PDF R2764 (sin campaña)</option>
            <option value="cliente">Clientes pagados</option>
          </select>
          <button
            type="button"
            onClick={() => void runBackfill()}
            className="rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white"
          >
            Importar leads Rueda
          </button>
          <button
            type="button"
            onClick={() => void runPaidSync()}
            className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-semibold"
          >
            Sync clientes pagados
          </button>
          <Link
            href="/admin/intelligence"
            className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm"
          >
            Intelligence
          </Link>
        </div>
      </div>

      {metrics && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Abiertas" value={String(metrics.totals.open)} />
          <Stat label="Ganadas" value={String(metrics.totals.won)} />
          <Stat label="S/ ganado" value={`S/ ${metrics.totals.amountWonPen.toFixed(0)}`} />
          <Stat label="Conversión" value={`${(metrics.conversion.wonRate * 100).toFixed(1)}%`} />
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm text-[var(--text-secondary)]">Cargando…</p>}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages
          .filter((s) => !s.is_closed_lost || (byStage.get(s.id)?.length ?? 0) > 0)
          .map((stage) => (
            <div
              key={stage.id}
              className="min-w-[240px] max-w-[280px] flex-shrink-0 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">{stage.label}</h2>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {byStage.get(stage.id)?.length ?? 0}
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {(byStage.get(stage.id) || []).map((opp) => (
                  <li key={opp.id}>
                    <Link
                      href={`/admin/comercial/opportunities/${opp.id}`}
                      className="block rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 shadow-sm transition hover:border-[var(--brand-blue)]"
                    >
                      <p className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                        {opp.title}
                      </p>
                      {opp.contact_whatsapp && (
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          WA {opp.contact_whatsapp}
                        </p>
                      )}
                      {opp.amount_pen != null && (
                        <p className="mt-1 text-xs font-medium text-[var(--brand-blue)]">
                          S/ {opp.amount_pen}
                        </p>
                      )}
                      <p className="mt-2 text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
                        {(opp.metadata?.campana_etapa as string) || opp.source}
                        {opp.adiso_id ? ` · ${opp.adiso_id}` : ''}
                      </p>
                    </Link>
                    {!stage.is_closed_won && !stage.is_closed_lost && (
                      <select
                        className="mt-1 w-full rounded border border-[var(--border-color)] bg-transparent px-2 py-1 text-[11px]"
                        value={opp.stage_id}
                        onChange={(e) => void moveStage(opp.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3">
      <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
      <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
