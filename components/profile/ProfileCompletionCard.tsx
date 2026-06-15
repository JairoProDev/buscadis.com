'use client';

import { ProfileCompletionResult, ProfileTask } from '@/lib/profile-completion';
import { IconCheck, IconZap } from '@/components/Icons';

interface ProfileCompletionCardProps {
  completion: ProfileCompletionResult;
  onTaskClick?: (task: ProfileTask) => void;
  compact?: boolean;
}

export default function ProfileCompletionCard({
  completion,
  onTaskClick,
  compact = false,
}: ProfileCompletionCardProps) {
  const pending = completion.tasks.filter((t) => !t.done);

  if (completion.percent >= 100) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
          <IconCheck size={18} color="#22c55e" />
        </span>
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">¡Perfil completo!</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Tu cuenta transmite confianza. Sigue publicando y conectando.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]">
      <div className="bg-gradient-to-r from-[rgba(var(--brand-primary-rgb),0.08)] to-[rgba(var(--brand-yellow-rgb),0.1)] px-4 py-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)]">
              <IconZap size={14} color="var(--brand-yellow)" />
              Fortalece tu perfil
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{completion.levelLabel}</p>
          </div>
          <span className="rounded-full bg-[var(--brand-blue)] px-2.5 py-1 text-xs font-bold text-white">
            {completion.percent}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-yellow)] transition-all duration-500"
            style={{ width: `${completion.percent}%` }}
          />
        </div>
        {!compact && (
          <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
            {completion.points} de {completion.maxPoints} puntos · {pending.length} pendiente
            {pending.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {!compact && pending.length > 0 && (
        <ul className="divide-y divide-[var(--border-color)]">
          {pending.slice(0, 4).map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onTaskClick?.(task)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--hover-bg)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--brand-blue)]/40 text-[10px] font-bold text-[var(--brand-blue)]">
                  +{task.points}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">
                    {task.label}
                  </span>
                  <span className="block text-xs text-[var(--text-secondary)]">{task.hint}</span>
                </span>
                <span className="text-xs font-semibold text-[var(--brand-blue)]">Añadir</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
