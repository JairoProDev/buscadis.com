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
  blue: 'bg-[rgba(var(--brand-primary-rgb),0.12)] text-[var(--brand-blue)]',
  yellow: 'bg-[rgba(var(--brand-yellow-rgb),0.18)] text-[var(--brand-yellow)]',
  neutral: 'bg-[var(--hover-bg)] text-[var(--text-primary)]',
};

const BADGE_BG: Record<HeaderAccent, string> = {
  blue: 'bg-[var(--brand-blue)]',
  yellow: 'bg-[var(--brand-yellow)] text-[#1e293b]',
  neutral: 'bg-[var(--text-secondary)]',
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
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
        active
          ? ACCENT_ACTIVE[accent]
          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] active:scale-95'
      }`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          className={`absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-white ${BADGE_BG[badgeColor]}`}
          aria-hidden
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
