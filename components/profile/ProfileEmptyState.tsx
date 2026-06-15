'use client';

import Link from 'next/link';

interface ProfileEmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function ProfileEmptyState({
  icon = '✨',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: ProfileEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] px-6 py-12 text-center">
      <span className="mb-3 text-4xl" aria-hidden>
        {icon}
      </span>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 rounded-full bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-full bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
