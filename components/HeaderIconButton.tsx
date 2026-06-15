'use client';

import React from 'react';

interface HeaderIconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  badge?: number;
  title?: string;
  'aria-label'?: string;
}

export default function HeaderIconButton({
  children,
  onClick,
  active = false,
  badge,
  title,
  'aria-label': ariaLabel,
}: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
        active
          ? 'bg-[var(--hover-bg)] text-[var(--brand-blue)]'
          : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] active:scale-95'
      }`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--brand-blue)] px-1 text-[9px] font-bold leading-none text-white"
          aria-hidden
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
