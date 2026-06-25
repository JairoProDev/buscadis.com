import type { BusinessProfile } from '@/types/business';

/** Mirrors DB enum `business_member_role` */
export type BusinessMemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

export type BusinessPermission =
  | 'business:read'
  | 'business:write'
  | 'business:delete'
  | 'business:publish'
  | 'team:read'
  | 'team:invite'
  | 'team:remove'
  | 'team:change_role'
  | 'catalog:read'
  | 'catalog:write'
  | 'analytics:read';

const ROLE_RANK: Record<BusinessMemberRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/** Minimum role required per permission (hierarchical). */
const PERMISSION_MIN_ROLE: Record<BusinessPermission, BusinessMemberRole> = {
  'business:read': 'viewer',
  'analytics:read': 'viewer',
  'catalog:read': 'viewer',
  'business:write': 'editor',
  'catalog:write': 'editor',
  'business:publish': 'editor',
  'team:read': 'editor',
  'team:invite': 'admin',
  'team:remove': 'admin',
  'team:change_role': 'admin',
  'business:delete': 'owner',
};

export function hasPermission(role: BusinessMemberRole, permission: BusinessPermission): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[PERMISSION_MIN_ROLE[permission]];
}

export interface BusinessWithRole {
  profile: BusinessProfile;
  role: BusinessMemberRole;
}

/** Returns active membership role or null. */
export async function getBusinessMemberRole(
  userId: string,
  businessProfileId: string
): Promise<BusinessMemberRole | null> {
  const { supabaseAdmin } = await import('@/lib/supabase-admin');
  const { data } = await supabaseAdmin
    .from('business_members')
    .select('role')
    .eq('business_profile_id', businessProfileId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return (data?.role as BusinessMemberRole) || null;
}

/** Owner, editor+ team member, or platform admin — same rules as publish/upload APIs. */
export async function canManageBusinessProfile(params: {
  userId: string;
  email?: string | null;
  businessProfileId: string;
  ownerUserId?: string | null;
}): Promise<boolean> {
  const { userId, email, businessProfileId, ownerUserId } = params;

  if (ownerUserId && ownerUserId === userId) return true;

  const role = await getBusinessMemberRole(userId, businessProfileId);
  if (role && ['owner', 'admin', 'editor'].includes(role)) return true;

  const { isPlatformAdminUser } = await import('@/lib/platform-admin');
  if (isPlatformAdminUser(email)) return true;

  const { supabaseAdmin } = await import('@/lib/supabase-admin');
  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('rol, is_platform_admin')
    .eq('id', userId)
    .maybeSingle();
  return isPlatformAdminUser(email, adminProfile);
}
