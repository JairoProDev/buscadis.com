import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  PROFILE_PROMPT_IDS,
  PROMPT_DISMISS_COOLDOWN_HOURS,
  type ProfilePromptId,
  type ProfilePromptRow,
} from '@/lib/profiling/prompt-types';

export function isValidPromptId(id: string): id is ProfilePromptId {
  return (PROFILE_PROMPT_IDS as readonly string[]).includes(id);
}

export async function listPromptRows(userId: string): Promise<ProfilePromptRow[]> {
  const { data, error } = await supabaseAdmin
    .from('user_profile_prompts')
    .select('prompt_id, status, dismissed_until, completed_at')
    .eq('user_id', userId);

  if (error) {
    console.error('[profiling] listPromptRows', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    prompt_id: row.prompt_id as ProfilePromptId,
    status: row.status as ProfilePromptRow['status'],
    dismissed_until: row.dismissed_until,
    completed_at: row.completed_at,
  }));
}

export async function markPromptDismissed(userId: string, promptId: ProfilePromptId) {
  const now = new Date();
  const until = new Date(now.getTime() + PROMPT_DISMISS_COOLDOWN_HOURS * 60 * 60 * 1000);

  const { error } = await supabaseAdmin.from('user_profile_prompts').upsert(
    {
      user_id: userId,
      prompt_id: promptId,
      status: 'dismissed',
      dismissed_at: now.toISOString(),
      dismissed_until: until.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: 'user_id,prompt_id' }
  );

  if (error) throw error;
  return { dismissed_until: until.toISOString() };
}

export async function markPromptCompleted(
  userId: string,
  promptId: ProfilePromptId,
  metadata: Record<string, unknown> = {}
) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from('user_profile_prompts').upsert(
    {
      user_id: userId,
      prompt_id: promptId,
      status: 'completed',
      completed_at: now,
      dismissed_at: null,
      dismissed_until: null,
      metadata,
      updated_at: now,
    },
    { onConflict: 'user_id,prompt_id' }
  );
  if (error) throw error;
}
