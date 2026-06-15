'use client';

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
      <h1 className="text-2xl font-bold mb-2">Intelligence Dashboard</h1>
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
