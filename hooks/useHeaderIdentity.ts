'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './useAuth';
import { useUser } from './useUser';
import { listBusinessProfilesForUser } from '@/lib/business';
import type { BusinessMemberRole } from '@/lib/business-access';
import {
  buildModeDisplay,
  formatModeSubtitle,
  ModeDisplay,
  resolveUserMode,
  UserMode,
} from '@/lib/user-modes';

export interface HeaderIdentity {
  displayName: string;
  avatarUrl?: string | null;
  initials: string;
  isBusinessMode: boolean;
  isVerificado: boolean;
  mode: UserMode;
  modeDisplay: ModeDisplay;
  /** Subtítulo bajo el nombre: "Explorador" | "Anunciante" | "Negocio · Dueño" */
  modeSubtitle: string;
}

function buildInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function useHeaderIdentity(): HeaderIdentity {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { profile, isAnunciante, isVerificado } = useUser();

  const [businessName, setBusinessName] = useState<string | null>(null);
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [businessRole, setBusinessRole] = useState<BusinessMemberRole | null>(null);

  const isBusinessRoute =
    pathname?.startsWith('/mi-negocio') || pathname?.startsWith('/negocio/');

  useEffect(() => {
    if (!user?.id || !isBusinessRoute) {
      setBusinessName(null);
      setBusinessLogo(null);
      setBusinessRole(null);
      return;
    }

    const businessId = searchParams.get('business');
    listBusinessProfilesForUser(user.id).then((list) => {
      const match = businessId
        ? list.find((m) => m.profile.id === businessId)
        : list[0];
      if (match) {
        setBusinessName(match.profile.name || match.profile.slug || 'Mi negocio');
        setBusinessLogo(match.profile.logo_url || null);
        setBusinessRole(match.role);
      }
    });
  }, [user?.id, isBusinessRoute, searchParams]);

  const userName =
    profile?.nombre && profile?.apellido
      ? `${profile.nombre} ${profile.apellido}`.trim()
      : profile?.nombre || user?.email?.split('@')[0] || 'Usuario';

  const mode = resolveUserMode(isBusinessRoute && !!businessName, isAnunciante);
  const modeDisplay = buildModeDisplay(mode, businessRole);
  const modeSubtitle = formatModeSubtitle(modeDisplay);

  if (isBusinessRoute && businessName) {
    return {
      displayName: businessName,
      avatarUrl: businessLogo || profile?.avatar_url,
      initials: buildInitials(businessName),
      isBusinessMode: true,
      isVerificado: !!isVerificado,
      mode,
      modeDisplay,
      modeSubtitle,
    };
  }

  return {
    displayName: userName,
    avatarUrl: profile?.avatar_url,
    initials: buildInitials(userName),
    isBusinessMode: false,
    isVerificado: !!isVerificado,
    mode,
    modeDisplay,
    modeSubtitle,
  };
}
