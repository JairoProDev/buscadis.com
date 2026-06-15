'use client';

import { useEffect, useState } from 'react';
import { Adiso } from '@/types';
import ProfileEmptyState from './ProfileEmptyState';
import { getCategoriaLabel } from '@/lib/adiso-display';

interface HistoryRow {
  id: string;
  adiso_id?: string;
  viewed_at: string;
  source: string;
  adiso?: Adiso | null;
}

export default function ProfileHistoryTab({ token }: { token?: string }) {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/profile/history', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setHistory(d.history || []))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="skeleton-shimmer h-48 rounded-2xl" />;

  if (history.length === 0) {
    return (
      <ProfileEmptyState
        icon="👁"
        title="Sin historial"
        description="Los avisos que abras aparecerán aquí para que los retomes fácilmente."
        actionLabel="Buscar ofertas"
        actionHref="/"
      />
    );
  }

  return (
    <div className="space-y-2">
      {history.map((row) => {
        const adiso = row.adiso;
        if (!adiso) return null;
        const img = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
        return (
          <a
            key={row.id}
            href={`/?adiso=${adiso.id}`}
            className="flex gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 transition-colors hover:border-[var(--brand-blue)]/30"
          >
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--bg-tertiary)]">
              {img ? (
                <img src={img} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg">📦</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {adiso.titulo}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {getCategoriaLabel(adiso.categoria)} ·{' '}
                {new Date(row.viewed_at).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
