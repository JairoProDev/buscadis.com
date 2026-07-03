'use client';

interface PublishStepIndicatorProps {
  step: number;
  total: number;
  labels: string[];
}

export default function PublishStepIndicator({ step, total, labels }: PublishStepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={n} className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                active
                  ? 'bg-[var(--brand-blue)] text-white'
                  : done
                    ? 'bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
              }`}
            >
              {done ? '✓' : n}
            </div>
            <span
              className={`text-xs font-medium truncate hidden sm:block ${
                active ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
              }`}
            >
              {labels[i]}
            </span>
            {i < total - 1 && (
              <div className={`flex-1 h-0.5 rounded ${done ? 'bg-[var(--brand-blue)]/40' : 'bg-[var(--border-color)]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
