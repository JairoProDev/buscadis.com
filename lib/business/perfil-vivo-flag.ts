/**
 * Flag de cutover Perfil Vivo — vive en profile_layout (sin migración DB).
 *
 * Env:
 * - PERFIL_VIVO_ENABLED_SLUGS=slug1,slug2  → cohort forzada (no se apaga en UI)
 * - PERFIL_VIVO_HARD_CUTOVER=1|all        → todos los perfiles públicos usan PV
 * - PERFIL_VIVO_HARD_CUTOVER_THRESHOLD=0.6 → % publicado+PV para recomendar hard cutover
 */
import type { BusinessProfile, ProfileLayoutSchema } from '@/types/business';

const ENV_SLUGS = () =>
  (process.env.PERFIL_VIVO_ENABLED_SLUGS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

/** Hard cutover global: legacy storefront deja de servir en público. */
export function isPerfilVivoHardCutover(): boolean {
  const v = (process.env.PERFIL_VIVO_HARD_CUTOVER || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'all';
}

/** Umbral 0–1 (default 0.6). Usado por cron de recomendación. */
export function perfilVivoHardCutoverThreshold(): number {
  const raw = Number(process.env.PERFIL_VIVO_HARD_CUTOVER_THRESHOLD || '0.6');
  if (!Number.isFinite(raw)) return 0.6;
  return Math.min(1, Math.max(0, raw));
}

export function evaluateHardCutoverReady(
  enabledCount: number,
  publishedCount: number,
  threshold = perfilVivoHardCutoverThreshold()
): { ready: boolean; ratio: number; threshold: number } {
  if (publishedCount <= 0) {
    return { ready: false, ratio: 0, threshold };
  }
  const ratio = enabledCount / publishedCount;
  return { ready: ratio >= threshold, ratio, threshold };
}

export function isPerfilVivoEnabled(
  profile: Partial<BusinessProfile> | null | undefined
): boolean {
  return perfilVivoEnableSource(profile) !== 'off';
}

/** Cómo quedó activado el cutover (hard/env ganan sobre el toggle). */
export function perfilVivoEnableSource(
  profile: Partial<BusinessProfile> | null | undefined
): 'hard' | 'env' | 'layout' | 'off' {
  if (isPerfilVivoHardCutover()) return 'hard';
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

/** True si el slug está en cohort env (para middleware edge sin DB). */
export function isPerfilVivoEnvCohortSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return ENV_SLUGS().includes(slug.toLowerCase());
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
