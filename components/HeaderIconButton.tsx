'use client';

import React from 'react';

type HeaderAccent = 'blue' | 'yellow' | 'neutral';

interface HeaderIconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
  title?: string;
  accent?: HeaderAccent;
  badgeAccent?: HeaderAccent;
  'aria-label'?: string;
}

const ACCENT_ACTIVE: Record<HeaderAccent, string> = {
  // Action (adis-600) for interactive chrome — not identity (fails AA as text-on-white contexts)
  blue: 'bg-[color-mix(in_srgb,var(--bs-action)_12%,transparent)] text-[var(--bs-action)]',
  yellow: 'bg-[color-mix(in_srgb,var(--bs-identity-warm)_18%,transparent)] text-[var(--bs-fg-on-warm)]',
  neutral: 'bg-[var(--hover-bg)] text-[var(--bs-fg-default)]',
};

const BADGE_BG: Record<HeaderAccent, string> = {
  blue: 'bg-[var(--bs-action)] text-[var(--bs-fg-on-action)]',
  yellow: 'bg-[var(--bs-publish-bg)] text-[var(--bs-fg-on-warm)]',
  neutral: 'bg-[var(--bs-fg-muted)] text-[var(--bs-fg-on-action)]',
};

export default function HeaderIconButton({
  children,
  onClick,
  active = false,
  badge,
  title,
  accent = 'blue',
  badgeAccent,
  'aria-label': ariaLabel,
}: HeaderIconButtonProps) {
  const badgeColor = badgeAccent ?? accent;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
        active
          ? ACCENT_ACTIVE[accent]
          : 'bg-transparent text-[var(--bs-fg-muted)] hover:bg-[var(--hover-bg)] active:scale-95'
      }`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          className={`absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ${BADGE_BG[badgeColor]}`}
          aria-hidden
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
