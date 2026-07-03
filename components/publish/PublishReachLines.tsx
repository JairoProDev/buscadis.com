'use client';

import { useEffect, useState } from 'react';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { getReachInsightLines, pickReachInsight } from '@/lib/publish/reach-insights';
import { AudienceFunnel } from '@/lib/publish/audience-estimates';
import { publishInsightBg } from './publish-ui';

interface PublishReachLinesProps {
  draft: PublishDraft;
  className?: string;
  variant?: 'single' | 'stack';
}

export default function PublishReachLines({
  draft,
  className = '',
  variant = 'single',
}: PublishReachLinesProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!draft.titulo?.trim() && !draft.categoria) {
      setLines([]);
      return;
    }

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
        .then((data: { funnel?: AudienceFunnel }) => {
          if (!data.funnel) {
            setLines([]);
            return;
          }
          const ctx = {
            categoria: draft.categoria,
            subcategoria: draft.subcategoria,
            titulo: draft.titulo,
          };
          if (variant === 'stack') {
            setLines(getReachInsightLines(data.funnel, ctx));
          } else {
            setLines([pickReachInsight(data.funnel, ctx)]);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setLines([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draft.categoria, draft.subcategoria, draft.titulo, draft.descripcion, draft.dailyRate, variant]);

  if (loading) {
    return (
      <p className={`text-xs text-[var(--text-tertiary)] m-0 animate-pulse ${className}`}>
        Calculando alcance…
      </p>
    );
  }

  if (lines.length === 0) return null;

  if (variant === 'single') {
    return (
      <p className={`text-xs leading-snug text-[var(--text-secondary)] m-0 ${className}`}>
        {lines[0]}
      </p>
    );
  }

  return (
    <ul className={`space-y-2 m-0 p-0 list-none ${className}`}>
      {lines.map((line, i) => (
        <li
          key={i}
          className={`text-xs leading-snug text-[var(--text-secondary)] ${publishInsightBg} ${
            i === lines.length - 1 ? 'text-[var(--text-primary)] font-medium' : ''
          }`}
        >
          {line}
        </li>
      ))}
    </ul>
  );
}
