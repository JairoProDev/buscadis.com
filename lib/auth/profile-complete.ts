import type { Profile } from '@/types';

export type UserIntencion = 'explorador' | 'anunciante' | 'negocio';

/** Identidad mínima: DNI + WhatsApp. Capacidades se activan aparte. */
export function isProfileOnboardingComplete(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.dni &&
      profile.dni_verified_at &&
      profile.whatsapp &&
      profile.whatsapp_verified_at
  );
}

export function needsBusinessRuc(intencion: UserIntencion | null | undefined): boolean {
  return intencion === 'negocio' || intencion === 'anunciante';
}

export function needsBusinessRucForCapabilities(caps: Array<'publish' | 'business'>): boolean {
  return caps.includes('business');
}
