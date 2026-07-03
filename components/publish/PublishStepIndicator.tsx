'use client';

const STEP_LABELS = ['Crear', 'Revisar', 'Publicar'] as const;

interface PublishStepIndicatorProps {
  step: 1 | 2 | 3;
}

export default function PublishStepIndicator({ step }: PublishStepIndicatorProps) {
  return (
    <div className="shrink-0 mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const done = n < step;
          const active = n === step;
          return (
            <div key={label} className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  active
                    ? 'bg-[var(--brand-blue)] text-white shadow-[0_4px_12px_-2px_rgba(var(--brand-primary-rgb),0.5)]'
                    : done
                      ? 'bg-[rgba(var(--brand-primary-rgb),0.15)] text-[var(--brand-blue)] ring-1 ring-[rgba(var(--brand-primary-rgb),0.25)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] ring-1 ring-[var(--border-color)]'
                }`}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M2.5 7.2L5.8 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-semibold truncate max-w-full ${
                  active ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((_, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                done
                  ? 'bg-[var(--brand-blue)]'
                  : active
                    ? 'bg-[rgba(var(--brand-primary-rgb),0.55)]'
                    : 'bg-[var(--bg-tertiary)]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
