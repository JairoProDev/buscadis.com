import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Message } from '@/types';

export function useChat(conversationId: string | null) {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const markedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !conversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      if (!supabase) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data as Message[]);
      }
      setLoading(false);

      if (markedRef.current !== conversationId && session?.access_token) {
        markedRef.current = conversationId;
        await fetch('/api/conversations/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ conversationId }),
        }).catch(() => {});
      }
    };

    fetchMessages();

    if (!supabase) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [user, conversationId, session?.access_token]);

  const sendMessage = async (content: string) => {
    if (!supabase || !user || !conversationId || !content.trim()) return;

    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      read: false,
    });

    if (error) console.error('Error sending message:', error);
    setSending(false);
  };

  return {
    messages,
    loading,
    sending,
    sendMessage,
    user,
  };
}
