'use client';

export type PublishStudioMode = 'capture' | 'form' | 'template' | 'design';

const MODES: Array<{ id: PublishStudioMode; label: string }> = [
  { id: 'capture', label: 'Captura' },
  { id: 'form', label: 'Formulario' },
  { id: 'template', label: 'Plantilla' },
  { id: 'design', label: 'Diseño' },
];

interface PublishModeSwitcherProps {
  mode: PublishStudioMode;
  onChange: (mode: PublishStudioMode) => void;
}

export default function PublishModeSwitcher({ mode, onChange }: PublishModeSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Modo de publicación"
      className="flex shrink-0 gap-1 overflow-x-auto px-3 pb-2"
    >
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? 'bg-[var(--brand-blue)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
