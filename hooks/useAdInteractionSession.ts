'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useUI } from '@/contexts/UIContext';

export type AskFieldResult =
  | { ok: true; conversationId: string; data: Record<string, unknown> }
  | { ok: false; needsAuth: true }
  | { ok: false; error: string };

export function useAdInteractionSession(adisoId: string, enabled: boolean) {
  const { session } = useAuth();
  const { openChat } = useUI();
  const [revealedFields, setRevealedFields] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [upsell, setUpsell] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const adisoTitleRef = useRef<string | undefined>();
  const openInFlightRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    conversationIdRef.current = null;
    openInFlightRef.current = null;
    adisoTitleRef.current = undefined;
    setConversationId(null);
    setRevealedFields([]);
    setUpsell(false);
  }, [adisoId]);

  const ensureOpen = useCallback(async (): Promise<string | null> => {
    if (!session?.access_token) return null;
    if (conversationIdRef.current) return conversationIdRef.current;
    if (openInFlightRef.current) return openInFlightRef.current;

    const promise = (async () => {
      const res = await fetch('/api/interactions/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ adisoId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.conversationId) return null;
      conversationIdRef.current = data.conversationId as string;
      setConversationId(data.conversationId);
      setRevealedFields(data.revealedFields || []);
      adisoTitleRef.current = data.adisoTitle;
      return data.conversationId as string;
    })();

    openInFlightRef.current = promise;
    try {
      return await promise;
    } finally {
      openInFlightRef.current = null;
    }
  }, [adisoId, session?.access_token]);

  // Warm session in background when viewing an ad — do not force-open the chat dock
  useEffect(() => {
    if (!enabled || !session?.access_token) return;
    let cancelled = false;
    setLoading(true);
    void ensureOpen()
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [adisoId, enabled, session?.access_token, ensureOpen]);

  const askField = useCallback(
    async (field: string, photoIndex?: number): Promise<AskFieldResult> => {
      if (!session?.access_token) {
        return { ok: false, needsAuth: true };
      }

      setAsking(true);
      try {
        const ensuredId = await ensureOpen();
        if (!ensuredId) {
          return { ok: false, error: 'No se pudo abrir la conversación' };
        }

        const res = await fetch('/api/interactions/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ adisoId, field, photoIndex }),
        });
        const data = await res.json();

        if (!res.ok) {
          return { ok: false, error: (data.error as string) || 'No se pudo enviar la pregunta' };
        }

        if (data.revealedFields) setRevealedFields(data.revealedFields);
        if (data.upsell) setUpsell(true);

        const convId = (data.conversationId as string) || ensuredId;
        conversationIdRef.current = convId;
        setConversationId(convId);
        openChat(convId, {
          adisoId,
          adisoTitle: adisoTitleRef.current,
        });

        return { ok: true, conversationId: convId, data };
      } finally {
        setAsking(false);
      }
    },
    [adisoId, session?.access_token, openChat, ensureOpen]
  );

  const isRevealed = useCallback(
    (field: string, photoIndex?: number) => {
      const key = photoIndex != null ? `fotos_${photoIndex}` : field;
      return revealedFields.includes(key) || revealedFields.includes(field);
    },
    [revealedFields]
  );

  return { conversationId, revealedFields, loading, asking, upsell, askField, isRevealed };
}
