import { supabaseAdmin } from '@/lib/supabase-admin';
import { extractKeywords } from '@/lib/interest-keywords';
import type { Categoria } from '@/types';

export type ChatTurnRole = 'user' | 'assistant' | 'system';

export async function persistChatTurn(params: {
  userId?: string | null;
  sessionId: string;
  role: ChatTurnRole;
  content: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabaseAdmin.from('ai_conversations').insert({
      user_id: params.userId || null,
      session_id: params.sessionId,
      role: params.role,
      content: params.content.slice(0, 8000),
      metadata: params.metadata || {},
    });
  } catch (e) {
    console.warn('[ai/conversation-persist]', e);
  }
}

export async function loadRecentChatTurns(
  sessionId: string,
  limit = 20
): Promise<Array<{ role: ChatTurnRole; content: string; created_at: string }>> {
  const { data, error } = await supabaseAdmin
    .from('ai_conversations')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.reverse() as Array<{ role: ChatTurnRole; content: string; created_at: string }>;
}

/**
 * Soft preference signal from chat search/recommend into interest profile.
 */
export async function recordChatInterestSignal(params: {
  userId: string;
  message: string;
  categoria?: Categoria | string | null;
  delta?: number;
}): Promise<void> {
  if (!params.userId) return;
  const keywords = extractKeywords(params.message);
  const categoria = params.categoria || 'productos';
  const delta = params.delta ?? 1;

  try {
    await supabaseAdmin.rpc('fn_record_interest_signal', {
      p_user_id: params.userId,
      p_categoria: categoria,
      p_keywords: keywords,
      p_delta: delta,
      p_reason: null,
    });
  } catch (e) {
    console.warn('[ai/chat-interest]', e);
  }

  // Also land in behavioral_events for P1 rebuild path
  try {
    await supabaseAdmin.from('behavioral_events').insert({
      user_id: params.userId,
      event_type: 'ai.chat.preference',
      entity_type: 'chat',
      entity_id: null,
      payload: { categoria, keywords, message: params.message.slice(0, 200) },
      context: {},
      score_delta: delta,
    });
  } catch {
    /* non-blocking */
  }
}
