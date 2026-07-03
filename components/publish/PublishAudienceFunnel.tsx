'use client';

import { useEffect, useState } from 'react';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { FUNNEL_LABELS, AudienceFunnel } from '@/lib/publish/audience-estimates';

interface PublishAudienceFunnelProps {
  draft: PublishDraft;
}

export default function PublishAudienceFunnel({ draft }: PublishAudienceFunnelProps) {
  const [funnel, setFunnel] = useState<AudienceFunnel | null>(null);
  const [reach, setReach] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (draft.categoria) params.set('categoria', draft.categoria);
      if (draft.subcategoria) params.set('subcategoria', draft.subcategoria);
      if (draft.titulo) params.set('titulo', draft.titulo);
      if (draft.descripcion) params.set('descripcion', draft.descripcion);
      params.set('dailyRate', String(draft.dailyRate ?? 5));

      fetch(`/api/publish/audience-funnel?${params}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          setFunnel(data.funnel ?? null);
          setReach(data.dailyReach ?? 0);
        })
        .catch(() => {
          if (!controller.signal.aborted) setFunnel(null);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draft.categoria, draft.subcategoria, draft.titulo, draft.descripcion, draft.dailyRate]);

  if (!draft.titulo?.trim() && !draft.categoria) return null;

  const levels = funnel
    ? (['A', 'B', 'C', 'D', 'E'] as const).map((key) => ({
        key,
        label: FUNNEL_LABELS[key],
        value: funnel[key],
      }))
    : [];

  const maxVal = funnel ? funnel.A : 1;

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{
        borderColor: 'rgba(var(--brand-primary-rgb), 0.2)',
        background: 'rgba(var(--brand-primary-rgb), 0.04)',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold m-0 text-[var(--text-primary)]">Tu red de alcance</p>
        {reach > 0 && (
          <span className="text-xs font-bold text-[var(--brand-blue)]">~{reach.toLocaleString()}/día</span>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-[var(--text-secondary)] m-0">Calculando embudo…</p>
      ) : funnel ? (
        <div className="space-y-2">
          {levels.map(({ key, label, value }) => (
            <div key={key}>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="font-bold text-[var(--brand-blue)]">{key}</span>
                <span className="text-[var(--text-secondary)] truncate ml-2 flex-1">{label}</span>
                <span className="font-bold ml-2">{value.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(4, (value / maxVal) * 100)}%`,
                    background: key === 'E' ? 'var(--brand-blue)' : 'rgba(var(--brand-primary-rgb), 0.4)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-secondary)] m-0">Completa tu aviso para ver el potencial</p>
      )}
    </div>
  );
}
