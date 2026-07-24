import type { Profile } from '@/types';

export type UserIntencion = 'explorador' | 'anunciante' | 'negocio';

/** Perfil listo para usar la app (identidad + WhatsApp + intención). */
export function isProfileOnboardingComplete(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.dni &&
      profile.dni_verified_at &&
      profile.whatsapp &&
      profile.whatsapp_verified_at &&
      profile.intencion
  );
}

export function needsBusinessRuc(intencion: UserIntencion | null | undefined): boolean {
  return intencion === 'negocio' || intencion === 'anunciante';
}
