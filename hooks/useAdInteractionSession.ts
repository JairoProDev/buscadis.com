'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useUI } from '@/contexts/UIContext';

export function useAdInteractionSession(adisoId: string, enabled: boolean) {
  const { session } = useAuth();
  const { openChat } = useUI();
  const [revealedFields, setRevealedFields] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [upsell, setUpsell] = useState(false);
  const openedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !session?.access_token || openedRef.current) return;
    openedRef.current = true;
    setLoading(true);

    fetch('/api/interactions/open', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ adisoId }),
    })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data?.conversationId) return;
        setConversationId(data.conversationId);
        setRevealedFields(data.revealedFields || []);
        openChat(data.conversationId, {
          adisoId,
          adisoTitle: data.adisoTitle,
        });
      })
      .finally(() => setLoading(false));
  }, [adisoId, enabled, session?.access_token, openChat]);

  const askField = useCallback(
    async (field: string, photoIndex?: number) => {
      if (!session?.access_token) return null;
      const res = await fetch('/api/interactions/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ adisoId, field, photoIndex }),
      });
      const data = await res.json();
      if (data.revealedFields) setRevealedFields(data.revealedFields);
      if (data.upsell) setUpsell(true);
      if (data.conversationId) {
        setConversationId(data.conversationId);
        openChat(data.conversationId, { adisoId });
      }
      return data;
    },
    [adisoId, session?.access_token, openChat]
  );

  const isRevealed = useCallback(
    (field: string, photoIndex?: number) => {
      const key = photoIndex != null ? `fotos_${photoIndex}` : field;
      return revealedFields.includes(key) || revealedFields.includes(field);
    },
    [revealedFields]
  );

  return { conversationId, revealedFields, loading, upsell, askField, isRevealed };
}
