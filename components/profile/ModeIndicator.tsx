'use client';

import React from 'react';
import type { BusinessMemberRole } from '@/lib/business-access';
import {
  IconExplore,
  IconMegaphone,
  IconStore,
  IconOwner,
  IconBusinessAdmin,
  IconEditor,
  IconEye,
} from '@/components/Icons';
import { ModeDisplay, UserMode } from '@/lib/user-modes';

const MODE_STYLES: Record<
  UserMode,
  { iconBg: string; iconColor: string; textColor: string }
> = {
  explorador: {
    iconBg: 'bg-[var(--bg-tertiary)]',
    iconColor: 'var(--text-secondary)',
    textColor: 'text-[var(--text-secondary)]',
  },
  anunciante: {
    iconBg: 'bg-[rgba(var(--brand-primary-rgb),0.12)]',
    iconColor: 'var(--brand-blue)',
    textColor: 'text-[var(--brand-blue)]',
  },
  negocio: {
    iconBg: 'bg-[rgba(var(--brand-yellow-rgb),0.18)]',
    iconColor: 'var(--brand-yellow)',
    textColor: 'text-[var(--text-primary)]',
  },
};

function ModeIcon({ mode, size = 12 }: { mode: UserMode; size?: number }) {
  const color = MODE_STYLES[mode].iconColor;
  if (mode === 'anunciante') return <IconMegaphone size={size} color={color} />;
  if (mode === 'negocio') return <IconStore size={size} color={color} />;
  return <IconExplore size={size} color={color} />;
}

function BusinessRoleIcon({ role, size = 11 }: { role: BusinessMemberRole; size?: number }) {
  const color = 'var(--brand-yellow)';
  if (role === 'owner') return <IconOwner size={size} color={color} />;
  if (role === 'admin') return <IconBusinessAdmin size={size} color={color} />;
  if (role === 'editor') return <IconEditor size={size} color={color} />;
  return <IconEye size={size} color={color} />;
}

interface ModeIndicatorProps {
  display: ModeDisplay;
  size?: 'sm' | 'md';
  showRoleIcon?: boolean;
}

export default function ModeIndicator({
  display,
  size = 'sm',
  showRoleIcon = true,
}: ModeIndicatorProps) {
  const styles = MODE_STYLES[display.mode];
  const iconBox = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1 ${textSize} font-semibold ${styles.textColor}`}>
      <span
        className={`inline-flex ${iconBox} shrink-0 items-center justify-center rounded-md ${styles.iconBg}`}
      >
        <ModeIcon mode={display.mode} size={size === 'sm' ? 10 : 12} />
      </span>
      <span>{display.modeLabel}</span>
      {display.mode === 'negocio' && display.businessRoleLabel && showRoleIcon && (
        <>
          <span className="opacity-40">·</span>
          <span className="inline-flex items-center gap-0.5 opacity-90">
            {display.businessRole && (
              <BusinessRoleIcon role={display.businessRole} size={10} />
            )}
            {display.businessRoleLabel}
          </span>
        </>
      )}
    </span>
  );
}

/** Versión inline para el trigger del header (una línea). */
export function ModeSubtitle({ display }: { display: ModeDisplay }) {
  const styles = MODE_STYLES[display.mode];
  return (
    <span className={`flex items-center gap-1 truncate text-[10px] font-semibold leading-tight ${styles.textColor}`}>
      <ModeIcon mode={display.mode} size={10} />
      <span className="truncate">
        {display.mode === 'negocio' && display.businessRoleLabel
          ? `${display.modeLabel} · ${display.businessRoleLabel}`
          : display.modeLabel}
      </span>
    </span>
  );
}
