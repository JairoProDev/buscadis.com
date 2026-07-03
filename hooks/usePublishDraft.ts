'use client';

import { useCallback, useEffect, useState } from 'react';
import { Categoria, Ubicacion } from '@/types';
import {
  EMPTY_PUBLISH_DRAFT,
  PublishDraft,
  detectMissingFields,
} from '@/lib/publish/publish-draft-types';

const STORAGE_KEY = 'publish_studio_draft_v1';

function loadDraft(): PublishDraft {
  if (typeof window === 'undefined') return { ...EMPTY_PUBLISH_DRAFT };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PUBLISH_DRAFT };
    return { ...EMPTY_PUBLISH_DRAFT, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_PUBLISH_DRAFT };
  }
}

function saveDraft(draft: PublishDraft) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota errors
  }
}

export function usePublishDraft(initial?: Partial<PublishDraft>) {
  const [draft, setDraftState] = useState<PublishDraft>(() => ({
    ...loadDraft(),
    ...initial,
  }));
  const [simpleMode, setSimpleMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const setDraft = useCallback((patch: Partial<PublishDraft> | ((prev: PublishDraft) => PublishDraft)) => {
    setDraftState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      next.missingFields = detectMissingFields(next);
      return next;
    });
  }, []);

  const mergeDraft = useCallback(
    (patch: Partial<PublishDraft>, confidence?: Record<string, number>) => {
      setDraft((prev) => {
        const merged: PublishDraft = { ...prev };
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === null) continue;
          if (key === 'aiConfidence' || key === 'atributos') continue;
          // Don't overwrite manually edited high-confidence fields unless new confidence is higher
          const conf = confidence?.[key] ?? 0.8;
          const existingConf = prev.aiConfidence[key] ?? 0;
          if (existingConf >= 0.9 && conf < existingConf) continue;
          (merged as unknown as Record<string, unknown>)[key] = value;
          if (confidence?.[key] !== undefined) {
            merged.aiConfidence[key] = confidence[key];
          }
        }
        if (patch.atributos) {
          merged.atributos = { ...prev.atributos, ...patch.atributos };
        }
        merged.missingFields = detectMissingFields(merged);
        return merged;
      });
    },
    [setDraft]
  );

  const resetDraft = useCallback(() => {
    const fresh = { ...EMPTY_PUBLISH_DRAFT, ...initial };
    setDraftState(fresh);
    saveDraft(fresh);
  }, [initial]);

  const addImage = useCallback((url: string) => {
    setDraft((prev) => ({
      ...prev,
      imagenes: prev.imagenes.includes(url) ? prev.imagenes : [...prev.imagenes, url],
    }));
  }, [setDraft]);

  const removeImage = useCallback((url: string) => {
    setDraft((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((u) => u !== url),
    }));
  }, [setDraft]);

  const setField = useCallback(
    <K extends keyof PublishDraft>(key: K, value: PublishDraft[K]) => {
      setDraft({ [key]: value } as Partial<PublishDraft>);
    },
    [setDraft]
  );

  const setAtributo = useCallback(
    (fieldId: string, value: string | string[] | boolean | number) => {
      setDraft((prev) => ({
        ...prev,
        atributos: { ...prev.atributos, [fieldId]: value },
      }));
    },
    [setDraft]
  );

  const addChatMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      setDraft((prev) => ({
        ...prev,
        chatHistory: [
          ...prev.chatHistory,
          { id: `${Date.now()}`, role, content, timestamp: Date.now() },
        ],
      }));
    },
    [setDraft]
  );

  return {
    draft,
    setDraft,
    mergeDraft,
    resetDraft,
    addImage,
    removeImage,
    setField,
    setAtributo,
    addChatMessage,
    simpleMode,
    setSimpleMode,
    showAdvanced,
    setShowAdvanced,
  };
}

export type UsePublishDraftReturn = ReturnType<typeof usePublishDraft>;
