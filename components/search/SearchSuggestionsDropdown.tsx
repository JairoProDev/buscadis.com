'use client';

import { getCategoriaLabel } from '@/lib/adiso-display';
import { Categoria } from '@/types';
import type { SuggestAdiso } from './useSearchSuggestions';
import { IconClose } from '@/components/Icons';

interface SearchSuggestionsDropdownProps {
  adisos: SuggestAdiso[];
  queries: string[];
  recent?: string[];
  popular?: string[];
  activeIndex: number;
  onSelectAdiso: (adiso: SuggestAdiso) => void;
  onSelectQuery: (query: string) => void;
  onRemoveRecent?: (query: string) => void;
  onClearRecent?: () => void;
  visible: boolean;
  listboxId?: string;
}

export default function SearchSuggestionsDropdown({
  adisos,
  queries,
  recent = [],
  popular = [],
  activeIndex,
  onSelectAdiso,
  onSelectQuery,
  onRemoveRecent,
  onClearRecent,
  visible,
  listboxId = 'search-suggestions',
}: SearchSuggestionsDropdownProps) {
  const hasContent =
    recent.length > 0 || popular.length > 0 || adisos.length > 0 || queries.length > 0;
  if (!visible || !hasContent) return null;

  let idx = 0;

  return (
    <ul
      id={listboxId}
      role="listbox"
      className="absolute left-0 right-0 top-full z-[950] mt-1 max-h-[min(360px,55vh)] overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] py-1 shadow-lg"
    >
      {recent.length > 0 && (
        <>
          <li className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
            <span>Recientes</span>
            {onClearRecent && (
              <button
                type="button"
                className="text-[10px] font-semibold normal-case tracking-normal text-[var(--brand-blue)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onClearRecent}
              >
                Limpiar
              </button>
            )}
          </li>
          {recent.map((q) => {
            const itemIndex = idx++;
            const active = activeIndex === itemIndex;
            return (
              <li key={`recent-${q}`} role="option" aria-selected={active}>
                <div
                  className={`flex w-full items-center gap-1 ${
                    active ? 'bg-[var(--hover-bg)]' : ''
                  }`}
                >
                  <button
                    type="button"
                    className={`min-w-0 flex-1 px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'text-[var(--brand-blue)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelectQuery(q)}
                  >
                    {q}
                  </button>
                  {onRemoveRecent && (
                    <button
                      type="button"
                      className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                      aria-label={`Quitar ${q} de recientes`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onRemoveRecent(q)}
                    >
                      <IconClose size={12} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </>
      )}

      {popular.length > 0 && (
        <>
          <li
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] ${
              recent.length > 0 ? 'mt-1 border-t border-[var(--border-color)]' : ''
            }`}
          >
            Populares
          </li>
          {popular.map((q) => {
            const itemIndex = idx++;
            const active = activeIndex === itemIndex;
            return (
              <li key={`popular-${q}`} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectQuery(q)}
                >
                  {q}
                </button>
              </li>
            );
          })}
        </>
      )}

      {adisos.length > 0 && (
        <>
          <li
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] ${
              recent.length > 0 || popular.length > 0
                ? 'mt-1 border-t border-[var(--border-color)]'
                : ''
            }`}
          >
            Anuncios
          </li>
          {adisos.map((adiso) => {
            const itemIndex = idx++;
            const active = activeIndex === itemIndex;
            return (
              <li key={adiso.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectAdiso(adiso)}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{adiso.titulo}</span>
                  <span className="shrink-0 text-[10px] font-semibold text-[var(--text-tertiary)]">
                    {getCategoriaLabel(adiso.categoria as Categoria)}
                  </span>
                </button>
              </li>
            );
          })}
        </>
      )}

      {queries.length > 0 && (
        <>
          <li className="mt-1 border-t border-[var(--border-color)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
            Búsquedas
          </li>
          {queries.map((q) => {
            const itemIndex = idx++;
            const active = activeIndex === itemIndex;
            return (
              <li key={`q-${q}`} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectQuery(q)}
                >
                  {q}
                </button>
              </li>
            );
          })}
        </>
      )}
    </ul>
  );
}
