/**
 * Platform superadmins can manage any business profile (e.g. buscadiss@gmail.com).
 */

const DEFAULT_PLATFORM_ADMIN_EMAILS = ['buscadiss@gmail.com'];

export function getPlatformAdminEmails(): string[] {
  const fromEnv =
    process.env.PLATFORM_ADMIN_EMAILS || process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS;
  if (fromEnv) {
    return fromEnv.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_PLATFORM_ADMIN_EMAILS;
}

export function isPlatformAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getPlatformAdminEmails().includes(email.toLowerCase());
}

export type PlatformAdminProfile = {
  rol?: string | null;
  is_platform_admin?: boolean | null;
};

export function isPlatformAdminProfile(profile?: PlatformAdminProfile | null): boolean {
  if (!profile) return false;
  return profile.rol === 'admin' || profile.is_platform_admin === true;
}

export function isPlatformAdminUser(
  email?: string | null,
  profile?: PlatformAdminProfile | null
): boolean {
  return isPlatformAdminEmail(email) || isPlatformAdminProfile(profile);
}
