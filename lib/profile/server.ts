import { supabaseAdmin } from '@/lib/supabase-admin';
import { dbToAdiso } from '@/lib/supabase';

export interface ProfileDashboardStats {
  favoritesCount: number;
  hiddenCount: number;
  adsCount: number;
  storiesCount: number;
  unreadMessages: number;
  unreadNotifications: number;
  isAnunciante: boolean;
  businessesCount: number;
}

export async function getProfileDashboardStats(userId: string): Promise<ProfileDashboardStats> {
  const [
    favRes,
    hiddenRes,
    adsRes,
    storiesRes,
    notifRes,
    profileRes,
    bizRes,
  ] = await Promise.all([
    supabaseAdmin.from('favoritos').select('adiso_id', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin
      .from('user_ad_interactions')
      .select('adiso_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('interaction_type', 'not_interested'),
    supabaseAdmin.from('adisos').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin.from('stories').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false),
    supabaseAdmin.from('profiles').select('rol').eq('id', userId).maybeSingle(),
    supabaseAdmin
      .from('business_members')
      .select('business_profile_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active'),
  ]);

  const { data: convs } = await supabaseAdmin
    .from('conversations')
    .select('id, participants')
    .contains('participants', [userId]);

  let unreadMessages = 0;
  const convIds = (convs || []).map((c) => c.id);
  if (convIds.length > 0) {
    const { count } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('read', false)
      .neq('sender_id', userId);
    unreadMessages = count || 0;
  }

  const rol = profileRes.data?.rol;
  const adsCount = adsRes.count || 0;

  return {
    favoritesCount: favRes.count || 0,
    hiddenCount: hiddenRes.count || 0,
    adsCount,
    storiesCount: storiesRes.count || 0,
    unreadMessages,
    unreadNotifications: notifRes.count || 0,
    isAnunciante: rol === 'anunciante' || rol === 'admin' || adsCount > 0,
    businessesCount: bizRes.count || 0,
  };
}

export async function getUserAdisosServer(userId: string, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('adisos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row) => dbToAdiso(row));
}

export async function recordViewHistoryServer(
  userId: string,
  params: {
    adisoId?: string;
    storyId?: string;
    businessProfileId?: string;
    source?: string;
  }
) {
  if (!params.adisoId && !params.storyId && !params.businessProfileId) return;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let dedupeQuery = supabaseAdmin
    .from('user_view_history')
    .select('id')
    .eq('user_id', userId)
    .gte('viewed_at', since);

  if (params.adisoId) dedupeQuery = dedupeQuery.eq('adiso_id', params.adisoId);
  if (params.storyId) dedupeQuery = dedupeQuery.eq('story_id', params.storyId);
  if (params.businessProfileId)
    dedupeQuery = dedupeQuery.eq('business_profile_id', params.businessProfileId);

  const { data: existing } = await dedupeQuery.maybeSingle();
  if (existing) {
    await supabaseAdmin
      .from('user_view_history')
      .update({ viewed_at: new Date().toISOString(), source: params.source || 'feed' })
      .eq('id', existing.id);
    return;
  }

  await supabaseAdmin.from('user_view_history').insert({
    user_id: userId,
    adiso_id: params.adisoId || null,
    story_id: params.storyId || null,
    business_profile_id: params.businessProfileId || null,
    source: params.source || 'feed',
  });
}

export async function getViewHistoryServer(userId: string, limit = 50) {
  const { data } = await supabaseAdmin
    .from('user_view_history')
    .select('*')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(limit);

  return data || [];
}

export async function findConversationBetween(userId: string, otherUserId: string) {
  const { data } = await supabaseAdmin
    .from('conversations')
    .select('id, participants')
    .contains('participants', [userId]);

  return (data || []).find(
    (c) =>
      Array.isArray(c.participants) &&
      c.participants.length === 2 &&
      c.participants.includes(userId) &&
      c.participants.includes(otherUserId)
  );
}
