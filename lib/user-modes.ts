import type { BusinessMemberRole } from '@/lib/business-access';

/** Modos de uso de la plataforma (no confundir con verificación). */
export type UserMode = 'explorador' | 'anunciante' | 'negocio';

export interface ModeDisplay {
  mode: UserMode;
  modeLabel: string;
  /** Solo en modo negocio: Dueño, Admin, Editor… */
  businessRoleLabel?: string;
  businessRole?: BusinessMemberRole;
}

export function resolveUserMode(isBusinessRoute: boolean, isAnunciante: boolean): UserMode {
  if (isBusinessRoute) return 'negocio';
  if (isAnunciante) return 'anunciante';
  return 'explorador';
}

export function businessRoleLabel(role: BusinessMemberRole): string {
  const map: Record<BusinessMemberRole, string> = {
    owner: 'Dueño',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Colaborador',
  };
  return map[role] || 'Colaborador';
}

export function modeLabel(mode: UserMode): string {
  const map: Record<UserMode, string> = {
    explorador: 'Explorador',
    anunciante: 'Anunciante',
    negocio: 'Negocio',
  };
  return map[mode];
}

export function buildModeDisplay(
  mode: UserMode,
  businessRole?: BusinessMemberRole | null
): ModeDisplay {
  return {
    mode,
    modeLabel: modeLabel(mode),
    businessRoleLabel: mode === 'negocio' && businessRole ? businessRoleLabel(businessRole) : undefined,
    businessRole: businessRole ?? undefined,
  };
}

/** Texto compacto bajo el nombre en el header. */
export function formatModeSubtitle(display: ModeDisplay): string {
  if (display.mode === 'negocio' && display.businessRoleLabel) {
    return `${display.modeLabel} · ${display.businessRoleLabel}`;
  }
  return display.modeLabel;
}
