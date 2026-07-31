'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Message } from '@/types';

function mergeIncoming(prev: Message[], incoming: Message): Message[] {
  const tempId =
    typeof incoming.metadata?.clientTempId === 'string'
      ? (incoming.metadata.clientTempId as string)
      : undefined;

  if (prev.some((m) => m.id === incoming.id)) {
    return prev.map((m) => (m.id === incoming.id ? { ...incoming, pending: false, failed: false } : m));
  }

  if (tempId) {
    const idx = prev.findIndex((m) => m.clientTempId === tempId || m.id === tempId);
    if (idx >= 0) {
      const next = [...prev];
      next[idx] = { ...incoming, pending: false, failed: false, clientTempId: tempId };
      return next;
    }
  }

  // Fallback: same sender + content within 8s of a pending temp
  const nearDup = prev.findIndex(
    (m) =>
      m.pending &&
      m.sender_id === incoming.sender_id &&
      m.content === incoming.content &&
      Math.abs(new Date(m.created_at).getTime() - new Date(incoming.created_at).getTime()) < 8000
  );
  if (nearDup >= 0) {
    const next = [...prev];
    next[nearDup] = { ...incoming, pending: false, failed: false };
    return next;
  }

  return [...prev, incoming];
}

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
          setMessages((prev) => mergeIncoming(prev, payload.new as Message));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated, pending: false } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [user, conversationId, session?.access_token]);

  const sendMessage = useCallback(
    async (content: string, opts?: { imageUrl?: string; caption?: string }) => {
      if (!user || !conversationId || !session?.access_token) return false;

      const text = (opts?.caption ?? content).trim();
      const imageUrl = opts?.imageUrl;
      if (!text && !imageUrl) return false;

      const clientTempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const displayContent = text || '📷 Foto';
      const optimistic: Message = {
        id: clientTempId,
        conversation_id: conversationId,
        sender_id: user.id,
        content: displayContent,
        read: false,
        created_at: new Date().toISOString(),
        message_kind: 'user',
        metadata: imageUrl ? { type: 'image', imageUrl, clientTempId } : { clientTempId },
        pending: true,
        clientTempId,
      };

      setMessages((prev) => [...prev, optimistic]);
      setSending(true);

      try {
        const res = await fetch('/api/conversations/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            conversationId,
            content: text || undefined,
            metadata: imageUrl ? { type: 'image', imageUrl } : undefined,
            clientTempId,
          }),
        });

        if (!res.ok) {
          setMessages((prev) =>
            prev.map((m) =>
              m.clientTempId === clientTempId ? { ...m, pending: false, failed: true } : m
            )
          );
          return false;
        }

        const data = (await res.json()) as { message?: Message };
        if (data.message) {
          setMessages((prev) => mergeIncoming(prev, data.message as Message));
        }
        return true;
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientTempId === clientTempId ? { ...m, pending: false, failed: true } : m
          )
        );
        return false;
      } finally {
        setSending(false);
      }
    },
    [user, conversationId, session?.access_token]
  );

  const sendImage = useCallback(
    async (file: File, caption?: string) => {
      if (!session?.access_token) return false;
      setSending(true);
      try {
        const form = new FormData();
        form.append('image', file);
        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'x-upload-type': 'adisos' },
          body: form,
        });
        if (!uploadRes.ok) {
          console.error('Image upload failed', await uploadRes.text());
          return false;
        }
        const uploaded = (await uploadRes.json()) as { url?: string };
        if (!uploaded.url) return false;
        // sendMessage manages its own sending flag for the message POST
        setSending(false);
        return await sendMessage(caption || '', { imageUrl: uploaded.url, caption });
      } catch {
        return false;
      } finally {
        setSending(false);
      }
    },
    [session?.access_token, sendMessage]
  );

  return {
    messages,
    loading,
    sending,
    sendMessage,
    sendImage,
    user,
  };
}
