'use client';

import { useEffect, useState } from 'react';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { pickReachInsight } from '@/lib/publish/reach-insights';
import { AudienceFunnel } from '@/lib/publish/audience-estimates';

interface PublishReachLinesProps {
  draft: PublishDraft;
  className?: string;
}

export default function PublishReachLines({ draft, className = '' }: PublishReachLinesProps) {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.titulo?.trim() && !draft.categoria) {
      setLine(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (draft.categoria) params.set('categoria', draft.categoria);
      if (draft.subcategoria) params.set('subcategoria', draft.subcategoria);
      if (draft.titulo) params.set('titulo', draft.titulo);
      if (draft.descripcion) params.set('descripcion', draft.descripcion);
      params.set('dailyRate', String(draft.dailyRate ?? 5));

      fetch(`/api/publish/audience-funnel?${params}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data: { funnel?: AudienceFunnel }) => {
          if (data.funnel) {
            setLine(pickReachInsight(data.funnel, {
              categoria: draft.categoria,
              subcategoria: draft.subcategoria,
              titulo: draft.titulo,
            }));
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setLine(null);
        });
    }, 600);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draft.categoria, draft.subcategoria, draft.titulo, draft.descripcion, draft.dailyRate]);

  if (!line) return null;

  return (
    <p className={`text-xs leading-snug text-[var(--text-secondary)] m-0 ${className}`}>
      {line}
    </p>
  );
}
