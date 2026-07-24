import { supabaseAdmin } from '@/lib/supabase-admin';
import type {
  CapabilityKey,
  CapabilityStatus,
  UserCapabilityRow,
} from '@/lib/auth/capability-types';

export type { CapabilityKey, CapabilityStatus, UserCapabilityRow } from '@/lib/auth/capability-types';

export async function upsertCapability(
  userId: string,
  capability: CapabilityKey,
  status: CapabilityStatus,
  meta: Record<string, unknown> = {}
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from('user_capabilities').upsert(
    {
      user_id: userId,
      capability,
      status,
      activated_at: status === 'active' || status === 'pending' ? now : null,
      meta,
      updated_at: now,
    },
    { onConflict: 'user_id,capability' }
  );
  if (error) return { ok: false, error: error.message };

  if (capability === 'publish') {
    const { data: p } = await supabaseAdmin
      .from('profiles')
      .select('rol')
      .eq('id', userId)
      .maybeSingle();

    if (status === 'active') {
      await supabaseAdmin
        .from('profiles')
        .update({
          can_publish: true,
          rol: p?.rol === 'admin' ? 'admin' : 'anunciante',
          updated_at: now,
        })
        .eq('id', userId);
    } else if (status === 'inactive' || status === 'suspended') {
      if (p?.rol !== 'admin') {
        await supabaseAdmin
          .from('profiles')
          .update({ can_publish: false, rol: 'usuario', updated_at: now })
          .eq('id', userId);
      } else {
        await supabaseAdmin
          .from('profiles')
          .update({ can_publish: false, updated_at: now })
          .eq('id', userId);
      }
    }
  }

  return { ok: true };
}

export async function getUserCapabilities(userId: string): Promise<UserCapabilityRow[]> {
  const { data, error } = await supabaseAdmin
    .from('user_capabilities')
    .select('user_id, capability, status, activated_at, meta')
    .eq('user_id', userId);

  if (error) {
    console.error('getUserCapabilities', error);
    return [];
  }
  return (data || []) as UserCapabilityRow[];
}

/** Sync capability rows from existing entities (business, rider, creator). */
export async function reconcileCapabilitiesFromEntities(userId: string): Promise<UserCapabilityRow[]> {
  const [{ data: profile }, { data: memberships }, { data: rider }, { data: creator }] =
    await Promise.all([
      supabaseAdmin.from('profiles').select('can_publish, rol').eq('id', userId).maybeSingle(),
      supabaseAdmin
        .from('business_members')
        .select('id, role, business_profile_id')
        .eq('user_id', userId)
        .limit(5),
      supabaseAdmin.from('moto_riders').select('id, estado').eq('user_id', userId).maybeSingle(),
      supabaseAdmin
        .from('creator_profiles')
        .select('user_id, referral_code, status, handle')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

  if (profile?.can_publish || profile?.rol === 'anunciante' || profile?.rol === 'admin') {
    await upsertCapability(userId, 'publish', 'active');
  }

  if (memberships && memberships.length > 0) {
    await upsertCapability(userId, 'business', 'active', {
      memberships: memberships.length,
    });
  }

  if (rider) {
    const status: CapabilityStatus =
      rider.estado === 'aprobado'
        ? 'active'
        : rider.estado === 'rechazado' || rider.estado === 'suspendido'
          ? 'suspended'
          : 'pending';
    await upsertCapability(userId, 'rider', status, { rider_id: rider.id, estado: rider.estado });
  }

  if (creator) {
    await upsertCapability(userId, 'influencer', (creator.status as CapabilityStatus) || 'active', {
      handle: creator.handle,
      referral_code: creator.referral_code,
    });
  }

  return getUserCapabilities(userId);
}

export function generateReferralCode(handleHint?: string): string {
  const base = (handleHint || 'busca')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'ref'}${suffix}`.toUpperCase();
}

export async function ensureCreatorWithReferral(
  userId: string,
  opts?: { handle?: string; bio?: string }
): Promise<{ ok: boolean; handle?: string; referral_code?: string; error?: string }> {
  const { data: existing } = await supabaseAdmin
    .from('creator_profiles')
    .select('user_id, handle, referral_code, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    let code = existing.referral_code as string | null;
    if (!code) {
      code = generateReferralCode(existing.handle);
      await supabaseAdmin
        .from('creator_profiles')
        .update({ referral_code: code, status: 'active', updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }
    await upsertCapability(userId, 'influencer', 'active', {
      handle: existing.handle,
      referral_code: code,
    });
    return { ok: true, handle: existing.handle, referral_code: code || undefined };
  }

  const handleBase =
    opts?.handle?.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) ||
    `creator${userId.slice(0, 6)}`;
  let handle = handleBase;
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabaseAdmin
      .from('creator_profiles')
      .select('user_id')
      .eq('handle', handle)
      .maybeSingle();
    if (!clash) break;
    handle = `${handleBase}${i + 1}`;
  }

  const referral_code = generateReferralCode(handle);
  const { error } = await supabaseAdmin.from('creator_profiles').insert({
    user_id: userId,
    handle,
    bio: opts?.bio || null,
    referral_code,
    status: 'active',
  });
  if (error) return { ok: false, error: error.message };

  await upsertCapability(userId, 'influencer', 'active', { handle, referral_code });
  return { ok: true, handle, referral_code };
}
