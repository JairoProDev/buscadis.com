import { supabaseAdmin } from '@/lib/supabase-admin';
import { rebuildUserBehaviorProfile } from '@/lib/behavior/rebuild-profiles';

/**
 * Attach pre-login behavioral_events to the authenticated user and rebuild profile.
 */
export async function mergeAnonymousEvents(
  userId: string,
  anonymousId: string
): Promise<{ merged: number }> {
  if (!userId || !anonymousId || anonymousId.length < 8) {
    return { merged: 0 };
  }

  const { data, error } = await supabaseAdmin
    .from('behavioral_events')
    .update({ user_id: userId })
    .eq('anonymous_id', anonymousId)
    .is('user_id', null)
    .select('id');

  if (error) {
    if (error.code === 'PGRST205') return { merged: 0 };
    console.error('[merge-anonymous]', error.message);
    return { merged: 0 };
  }

  const merged = data?.length ?? 0;
  if (merged > 0) {
    try {
      await rebuildUserBehaviorProfile(userId);
    } catch (e) {
      console.warn('[merge-anonymous] rebuild failed', e);
    }
  }

  return { merged };
}
