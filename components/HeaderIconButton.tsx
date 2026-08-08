'use client';

import React from 'react';
import { IconButton, cn } from '@buscadis/ui';

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

const ACTIVE: Record<HeaderAccent, string> = {
  blue: 'bg-[color-mix(in_srgb,var(--bs-action)_12%,transparent)] text-[var(--bs-action)]',
  yellow:
    'bg-[color-mix(in_srgb,var(--bs-identity-warm)_18%,transparent)] text-[var(--bs-fg-on-warm)]',
  neutral: 'bg-[var(--hover-bg)] text-[var(--bs-fg-default)]',
};

const BADGE_TONE: Record<HeaderAccent, 'action' | 'warm' | 'muted'> = {
  blue: 'action',
  yellow: 'warm',
  neutral: 'muted',
};

/**
 * @deprecated Prefer importing IconButton from @buscadis/ui directly.
 * Thin accent/badge adapter for Header during Sprint 3 migration.
 */
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
  const label = ariaLabel ?? title;
  if (!label) {
    throw new Error('HeaderIconButton requires aria-label or title');
  }

  return (
    <IconButton
      aria-label={label}
      title={title}
      onClick={onClick}
      badge={badge}
      badgeTone={BADGE_TONE[badgeAccent ?? accent]}
      variant="ghost"
      size="md"
      className={cn(
        active
          ? ACTIVE[accent]
          : 'bg-transparent text-[var(--bs-fg-muted)] hover:bg-[var(--hover-bg)]'
      )}
    >
      {children}
    </IconButton>
  );
}
