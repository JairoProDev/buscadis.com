import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Conversation } from '@/types';

async function fetchUnreadForConversations(
  userId: string,
  conversationIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!supabase || conversationIds.length === 0) return map;

  const { data } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', conversationIds)
    .eq('read', false)
    .neq('sender_id', userId);

  (data || []).forEach((row: { conversation_id: string }) => {
    map.set(row.conversation_id, (map.get(row.conversation_id) || 0) + 1);
  });
  return map;
}

export function useConversations() {
  const { user, session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    const db = supabase;
    if (!user || !db) return;
    setLoading(true);

    const { data, error } = await db
      .from('conversations')
      .select('id, participants, last_message, last_message_at, updated_at, created_at')
      .contains('participants', [user.id])
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
      return;
    }

    const ids = (data || []).map((c) => c.id);
    const unreadMap = await fetchUnreadForConversations(user.id, ids);

    const enhanced = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.participants.find((id: string) => id !== user.id);
        let otherUser = null;

        if (otherUserId) {
          const { data: userData } = await db
            .from('profiles')
            .select('id, email, nombre, avatar_url')
            .eq('id', otherUserId)
            .maybeSingle();
          otherUser = userData;
        }

        return {
          ...conv,
          other_user: otherUser,
          unread_count: unreadMap.get(conv.id) || 0,
        } as Conversation;
      })
    );

    setConversations(enhanced);
    setUnreadCount(Array.from(unreadMap.values()).reduce((a, b) => a + b, 0));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchConversations();

    if (!supabase) return;
    const db = supabase;

    const channel = db
      .channel(`conversations:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `participants=cs.{${user.id}}` },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    unreadCount,
    loading,
    refetch: fetchConversations,
    session,
  };
}
