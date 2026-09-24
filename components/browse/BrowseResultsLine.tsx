'use client';

import { IconShare } from '@/components/Icons';
import { buildBrowseResultsLine } from '@/lib/browse/results-line';
import type { Categoria } from '@/types';
import type { BrowseFilterState } from '@/lib/filters/types';
import type { TipoOrdenamiento } from '@/lib/filters/sort-options';

interface BrowseResultsLineProps {
  loading?: boolean;
  resultCount: number;
  hasMore: boolean;
  categoria: Categoria | 'todos';
  filters: BrowseFilterState;
  committedQuery: string;
  ordenamiento?: TipoOrdenamiento;
  onShare?: () => void;
  showShare?: boolean;
}

export default function BrowseResultsLine({
  loading,
  resultCount,
  hasMore,
  categoria,
  filters,
  committedQuery,
  ordenamiento,
  onShare,
  showShare,
}: BrowseResultsLineProps) {
  if (loading) {
    return (
      <div className="mb-1 h-4 w-48 max-w-full animate-pulse rounded bg-[var(--bg-secondary)]" aria-hidden />
    );
  }

  const line = buildBrowseResultsLine({
    resultCount,
    hasMore,
    categoria,
    filters,
    committedQuery,
    ordenamiento,
  });

  return (
    <div className="mb-1 flex min-h-[1.125rem] items-center gap-1.5">
      <p className="m-0 min-w-0 flex-1 truncate text-[11px] leading-snug text-[var(--text-tertiary)]">
        {line}
      </p>
      {showShare && onShare && (
        <button
          type="button"
          onClick={onShare}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--brand-blue)]"
          title="Compartir búsqueda"
          aria-label="Compartir búsqueda"
        >
          <IconShare size={14} />
        </button>
      )}
    </div>
  );
}
