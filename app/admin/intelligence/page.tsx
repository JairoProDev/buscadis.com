'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface IntelligenceStats {
  totals: {
    behavioralEvents: number;
    behaviorProfiles: number;
    activeDemandIntents: number;
    campaigns: number;
    packageOrdersPaid: number;
    connectedMatches: number;
  };
  funnel: {
    demandIntents: number;
    paidPublications: number;
    campaignsLaunched: number;
    crossMatchesConnected: number;
  };
  demandByCategory: Record<string, number>;
  deliveriesByChannel: Record<string, { sent: number; failed: number }>;
  recentInferences: { inference_type: string; confidence: number; created_at: string }[];
  personalizationFunnel?: {
    day: string;
    impressions: number;
    clicks: number;
    contacts: number;
    searches: number;
  }[];
  topZeroSearches?: { query_text: string; zero_count: number; last_seen: string }[];
  mobileAnalyticsEvents24h?: number;
}

export default function AdminIntelligencePage() {
  const { session } = useAuth();
  const [stats, setStats] = useState<IntelligenceStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/admin/intelligence', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Sin permisos' : 'Error al cargar');
        return r.json();
      })
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, [session?.access_token]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Intelligence Dashboard</h1>
        <Link href="/admin/comercial" className="text-sm font-medium text-[var(--brand-blue)]">
          Comercial →
        </Link>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Demanda, perfiles de comportamiento y calidad de matching.
      </p>

      {error && <p className="text-red-500">{error}</p>}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(stats.totals).map(([key, val]) => (
              <div key={key} className="rounded-xl border p-4 bg-[var(--bg-secondary)]">
                <p className="text-xs text-[var(--text-tertiary)]">{key}</p>
                <p className="text-xl font-bold">{val}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="font-semibold mb-2">Funnel publicar → conectar</h2>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between border-b py-1">
                <span>Intenciones de demanda activas</span>
                <span className="font-medium">{stats.funnel.demandIntents}</span>
              </li>
              <li className="flex justify-between border-b py-1">
                <span>Publicaciones pagadas</span>
                <span className="font-medium">{stats.funnel.paidPublications}</span>
              </li>
              <li className="flex justify-between border-b py-1">
                <span>Campañas lanzadas</span>
                <span className="font-medium">{stats.funnel.campaignsLaunched}</span>
              </li>
              <li className="flex justify-between border-b py-1">
                <span>Matches conectados (both paid)</span>
                <span className="font-medium">{stats.funnel.crossMatchesConnected}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Entregas por canal</h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(stats.deliveriesByChannel || {}).map(([ch, v]) => (
                <li key={ch} className="flex justify-between border-b py-1">
                  <span>{ch}</span>
                  <span className="font-medium">
                    {v.sent} enviados · {v.failed} fallidos
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Demanda por categoría</h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(stats.demandByCategory).map(([cat, n]) => (
                <li key={cat} className="flex justify-between border-b py-1">
                  <span>{cat}</span>
                  <span className="font-medium">{n}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">App móvil (24h)</h2>
            <p className="text-sm">
              Eventos en <code className="text-xs">mobile_analytics_events</code>:{' '}
              <strong>{stats.mobileAnalyticsEvents24h ?? 0}</strong>
            </p>
          </section>

          {stats.personalizationFunnel && stats.personalizationFunnel.length > 0 && (
            <section>
              <h2 className="font-semibold mb-2">Funnel clasificados (7d)</h2>
              <ul className="text-xs space-y-1">
                {stats.personalizationFunnel.map((d) => (
                  <li key={d.day} className="flex justify-between border-b py-1">
                    <span>{new Date(d.day).toLocaleDateString()}</span>
                    <span>
                      {d.impressions} imp · {d.clicks} clk · {d.contacts} contactos · {d.searches}{' '}
                      búsquedas
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {stats.topZeroSearches && stats.topZeroSearches.length > 0 && (
            <section>
              <h2 className="font-semibold mb-2">Búsquedas sin resultados (7d)</h2>
              <ul className="text-xs space-y-1">
                {stats.topZeroSearches.map((z) => (
                  <li key={z.query_text} className="flex justify-between border-b py-1">
                    <span className="truncate max-w-[60%]">{z.query_text}</span>
                    <span>{z.zero_count}×</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-semibold mb-2">Inferencias recientes</h2>
            <ul className="text-xs space-y-1 text-[var(--text-secondary)]">
              {stats.recentInferences.map((inf, i) => (
                <li key={i}>
                  {inf.inference_type} · conf {inf.confidence} · {new Date(inf.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
