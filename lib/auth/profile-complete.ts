import type { Profile } from '@/types';

export type UserIntencion = 'explorador' | 'anunciante' | 'negocio';

/**
 * Identidad “fuerte” para gates (publicar / negocio / rider).
 * Ya no bloquea el acceso a la app: el profiling progresivo es omitible.
 */
export function isProfileOnboardingComplete(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.dni &&
      profile.dni_verified_at &&
      profile.whatsapp &&
      profile.whatsapp_verified_at
  );
}

/** Soft identity for progressive prompts — WhatsApp number enough (OTP optional). */
export function hasSoftContact(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.whatsapp);
}

export function needsBusinessRuc(intencion: UserIntencion | null | undefined): boolean {
  return intencion === 'negocio' || intencion === 'anunciante';
}

export function needsBusinessRucForCapabilities(caps: Array<'publish' | 'business'>): boolean {
  return caps.includes('business');
}
