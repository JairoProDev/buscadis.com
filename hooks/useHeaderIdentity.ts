'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './useAuth';
import { useUser } from './useUser';
import { listBusinessProfilesForUser } from '@/lib/business';
import type { BusinessMemberRole } from '@/lib/business-access';

export type HeaderRoleTone = 'business' | 'publisher' | 'verified' | 'default' | 'admin';

export interface HeaderIdentity {
  displayName: string;
  avatarUrl?: string | null;
  roleLabel: string;
  roleTone: HeaderRoleTone;
  isBusinessMode: boolean;
  initials: string;
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

function roleLabelForUser(
  rol: string | undefined,
  isAnunciante: boolean,
  isVerificado: boolean
): { label: string; tone: HeaderRoleTone } {
  if (rol === 'admin') return { label: 'Administrador', tone: 'admin' };
  if (isVerificado && isAnunciante) return { label: 'Anunciante verificado', tone: 'verified' };
  if (isVerificado) return { label: 'Cuenta verificada', tone: 'verified' };
  if (isAnunciante) return { label: 'Anunciante', tone: 'publisher' };
  return { label: 'Explorador', tone: 'default' };
}

function roleLabelForBusiness(role: BusinessMemberRole): string {
  const map: Record<BusinessMemberRole, string> = {
    owner: 'Dueño del negocio',
    admin: 'Admin del negocio',
    editor: 'Editor',
    viewer: 'Colaborador',
  };
  return map[role] || 'Mi negocio';
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

  const userRole = roleLabelForUser(profile?.rol, isAnunciante, isVerificado);

  if (isBusinessRoute && businessName) {
    return {
      displayName: businessName,
      avatarUrl: businessLogo || profile?.avatar_url,
      roleLabel: businessRole ? roleLabelForBusiness(businessRole) : 'Modo negocio',
      roleTone: 'business',
      isBusinessMode: true,
      initials: buildInitials(businessName),
    };
  }

  return {
    displayName: userName,
    avatarUrl: profile?.avatar_url,
    roleLabel: userRole.label,
    roleTone: userRole.tone,
    isBusinessMode: false,
    initials: buildInitials(userName),
  };
}
