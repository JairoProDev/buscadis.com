/**
 * Flag de cutover Perfil Vivo — vive en profile_layout (sin migración DB).
 */
import type { BusinessProfile, ProfileLayoutSchema } from '@/types/business';

const ENV_SLUGS = () =>
  (process.env.PERFIL_VIVO_ENABLED_SLUGS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export function isPerfilVivoEnabled(
  profile: Partial<BusinessProfile> | null | undefined
): boolean {
  return perfilVivoEnableSource(profile) !== 'off';
}

/** Cómo quedó activado el cutover (cohort env gana sobre el toggle). */
export function perfilVivoEnableSource(
  profile: Partial<BusinessProfile> | null | undefined
): 'env' | 'layout' | 'off' {
  if (!profile) return 'off';
  if (profile.slug && ENV_SLUGS().includes(profile.slug.toLowerCase())) return 'env';
  const layout = profile.profile_layout as
    | (ProfileLayoutSchema & { perfil_vivo_enabled?: boolean })
    | null
    | undefined;
  if (layout?.perfil_vivo_enabled === true) return 'layout';
  return 'off';
}

export function listPerfilVivoEnvCohort(): string[] {
  return ENV_SLUGS();
}

export function withPerfilVivoEnabled(
  profile: Partial<BusinessProfile>,
  enabled: boolean
): Partial<BusinessProfile> {
  const prev = (profile.profile_layout || {
    structureTemplateId: 'default',
    styleSkinId: 'default',
    slots: [],
  }) as ProfileLayoutSchema & { perfil_vivo_enabled?: boolean };

  return {
    ...profile,
    profile_layout: {
      ...prev,
      structureTemplateId: prev.structureTemplateId || 'default',
      styleSkinId: prev.styleSkinId || 'default',
      slots: Array.isArray(prev.slots) ? prev.slots : [],
      perfil_vivo_enabled: enabled,
    },
  };
}
