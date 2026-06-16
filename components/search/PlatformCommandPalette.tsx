'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { filterPlatformCommands, type PlatformCommand } from '@/lib/platform-commands';
import { Categoria } from '@/types';
import { IconSearch } from '@/components/Icons';

interface PlatformCommandPaletteProps {
  onSelectCategory?: (categoria: Categoria) => void;
  onAction?: (actionId: string) => void;
  onFocusFilterSection?: (sectionId: string) => void;
  placeholder?: string;
}

export default function PlatformCommandPalette({
  onSelectCategory,
  onAction,
  onFocusFilterSection,
  placeholder = 'Buscar páginas, acciones, filtros…',
}: PlatformCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => filterPlatformCommands(query, 10), [query]);

  const runCommand = (cmd: PlatformCommand) => {
    setQuery('');
    setOpen(false);
    if (cmd.kind === 'navigate' && cmd.href) {
      router.push(cmd.href);
      return;
    }
    if (cmd.kind === 'category' && cmd.category) {
      onSelectCategory?.(cmd.category);
      return;
    }
    if (cmd.kind === 'action' && cmd.actionId) {
      onAction?.(cmd.actionId);
      return;
    }
    if (cmd.kind === 'filter' && cmd.sectionId) {
      onFocusFilterSection?.(cmd.sectionId);
    }
  };

  return (
    <div className="relative mb-3">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2.5 py-1.5">
        <IconSearch size={14} color="var(--text-tertiary)" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-none bg-transparent text-xs outline-none text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          aria-label="Buscar en la plataforma"
          autoComplete="off"
        />
      </div>
      {open && query.trim().length > 0 && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-[600] mt-1 max-h-56 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] py-1 shadow-lg">
          {results.map((cmd) => (
            <li key={cmd.id}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[var(--hover-bg)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runCommand(cmd)}
              >
                <span className="text-xs font-semibold text-[var(--text-primary)]">{cmd.label}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">{cmd.group}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
