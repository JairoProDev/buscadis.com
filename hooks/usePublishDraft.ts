'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  EMPTY_PUBLISH_DRAFT,
  PublishDraft,
  detectMissingFields,
} from '@/lib/publish/publish-draft-types';

const STORAGE_KEY = 'publish_studio_draft_v1';
const STEP_KEY = 'publish_studio_step_v1';

export type StudioStep = 'compose' | 'review' | 'pay';

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

export function loadStudioStep(): StudioStep {
  if (typeof window === 'undefined') return 'compose';
  try {
    const raw = sessionStorage.getItem(STEP_KEY);
    if (raw === 'compose' || raw === 'review' || raw === 'pay') return raw;
  } catch {
    // ignore
  }
  return 'compose';
}

export function saveStudioStep(step: StudioStep) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STEP_KEY, step);
  } catch {
    // ignore
  }
}

/** Solo aplica iniciales con valor real; no pisa el borrador guardado con '' o []. */
function mergeInitialOverSaved(
  saved: PublishDraft,
  initial?: Partial<PublishDraft>,
): PublishDraft {
  if (!initial) return saved;
  const next: PublishDraft = { ...saved };
  for (const [key, value] of Object.entries(initial)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    (next as unknown as Record<string, unknown>)[key] = value;
  }
  return next;
}

export function usePublishDraft(initial?: Partial<PublishDraft>) {
  const [draft, setDraftState] = useState<PublishDraft>(() =>
    mergeInitialOverSaved(loadDraft(), initial),
  );
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
          if (key === 'aiConfidence' || key === 'atributos' || key === 'imagenes') continue;
          if (typeof value === 'string' && !value.trim()) continue;
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
        if (Array.isArray(patch.imagenes) && patch.imagenes.length > 0) {
          const set = new Set([...prev.imagenes, ...patch.imagenes]);
          merged.imagenes = Array.from(set);
        }
        merged.missingFields = detectMissingFields(merged);
        return merged;
      });
    },
    [setDraft]
  );

  const resetDraft = useCallback(() => {
    const fresh = mergeInitialOverSaved({ ...EMPTY_PUBLISH_DRAFT }, initial);
    setDraftState(fresh);
    saveDraft(fresh);
    saveStudioStep('compose');
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
    showAdvanced,
    setShowAdvanced,
  };
}

export type UsePublishDraftReturn = ReturnType<typeof usePublishDraft>;
