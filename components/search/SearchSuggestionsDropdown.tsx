'use client';

import { getCategoriaLabel } from '@/lib/adiso-display';
import { Categoria } from '@/types';
import type { SuggestAdiso } from './useSearchSuggestions';

interface SearchSuggestionsDropdownProps {
  adisos: SuggestAdiso[];
  queries: string[];
  activeIndex: number;
  onSelectAdiso: (adiso: SuggestAdiso) => void;
  onSelectQuery: (query: string) => void;
  visible: boolean;
  listboxId?: string;
}

export default function SearchSuggestionsDropdown({
  adisos,
  queries,
  activeIndex,
  onSelectAdiso,
  onSelectQuery,
  visible,
  listboxId = 'search-suggestions',
}: SearchSuggestionsDropdownProps) {
  if (!visible || (adisos.length === 0 && queries.length === 0)) return null;

  let idx = 0;

  return (
    <ul
      id={listboxId}
      role="listbox"
      className="absolute left-0 right-0 top-full z-[950] mt-1 max-h-[min(320px,50vh)] overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] py-1 shadow-lg"
    >
      {adisos.length > 0 && (
        <li className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
          Anuncios
        </li>
      )}
      {adisos.map((adiso) => {
        const itemIndex = idx++;
        const active = activeIndex === itemIndex;
        return (
          <li key={adiso.id} role="option" aria-selected={active}>
            <button
              type="button"
              className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${
                active ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)]' : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
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
      {queries.length > 0 && (
        <li className="mt-1 border-t border-[var(--border-color)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
          Búsquedas
        </li>
      )}
      {queries.map((q) => {
        const itemIndex = idx++;
        const active = activeIndex === itemIndex;
        return (
          <li key={q} role="option" aria-selected={active}>
            <button
              type="button"
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                active ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)]' : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectQuery(q)}
            >
              {q}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
