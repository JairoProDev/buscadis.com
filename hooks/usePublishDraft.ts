'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EMPTY_PUBLISH_DRAFT,
  PublishDraft,
  detectMissingFields,
} from '@/lib/publish/publish-draft-types';

const STORAGE_KEY = 'publish_studio_draft_v1';
const STEP_KEY = 'publish_studio_step_v1';
const LEGACY_SESSION_KEY = 'publish_studio_draft_v1';

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // cuota llena o modo privado
  }
}

export type StudioStep = 'compose' | 'review' | 'pay';

function loadDraft(): PublishDraft {
  if (typeof window === 'undefined') return { ...EMPTY_PUBLISH_DRAFT };
  const fromLocal = readStorage(window.localStorage, STORAGE_KEY);
  const fromSession = readStorage(window.sessionStorage, LEGACY_SESSION_KEY);
  const raw = fromLocal || fromSession;
  if (!raw) return { ...EMPTY_PUBLISH_DRAFT };
  try {
    const parsed = { ...EMPTY_PUBLISH_DRAFT, ...JSON.parse(raw) };
    if (!fromLocal && fromSession) writeStorage(window.localStorage, STORAGE_KEY, raw);
    return parsed;
  } catch {
    return { ...EMPTY_PUBLISH_DRAFT };
  }
}

function saveDraft(draft: PublishDraft) {
  if (typeof window === 'undefined') return;
  writeStorage(window.localStorage, STORAGE_KEY, JSON.stringify(draft));
}

export function clearPublishDraftStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(STEP_KEY);
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
    window.sessionStorage.removeItem(STEP_KEY);
  } catch {
    // ignore
  }
}

export function loadStudioStep(): StudioStep {
  if (typeof window === 'undefined') return 'compose';
  const raw = readStorage(window.localStorage, STEP_KEY) || readStorage(window.sessionStorage, STEP_KEY);
  if (raw === 'compose' || raw === 'review' || raw === 'pay') return raw;
  return 'compose';
}

export function saveStudioStep(step: StudioStep) {
  if (typeof window === 'undefined') return;
  writeStorage(window.localStorage, STEP_KEY, step);
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

const HISTORY_LIMIT = 400;
const TEXT_KEYS = new Set(['titulo', 'descripcion', 'contacto', 'ubicacion', 'precio', 'coverOverlay', 'cardLayout']);

interface DraftHistory {
  present: PublishDraft;
  past: PublishDraft[];
  future: PublishDraft[];
}

function withMissing(draft: PublishDraft): PublishDraft {
  return { ...draft, missingFields: detectMissingFields(draft) };
}

export function usePublishDraft(
  initial?: Partial<PublishDraft>,
  options?: { persist?: boolean; fresh?: boolean },
) {
  const persistRef = useRef(options?.persist !== false);
  persistRef.current = options?.persist !== false;
  const remember = (next: PublishDraft) => {
    if (persistRef.current) saveDraft(next);
  };
  const [history, setHistory] = useState<DraftHistory>(() => ({
    present: withMissing(
      options?.fresh
        ? mergeInitialOverSaved({ ...EMPTY_PUBLISH_DRAFT }, initial)
        : mergeInitialOverSaved(loadDraft(), initial),
    ),
    past: [],
    future: [],
  }));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const lastTextPush = useRef(0);
  const draft = history.present;

  useEffect(() => {
    remember(draft);
  }, [draft]);

  useEffect(() => {
    const flush = () => remember(draft);
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [draft]);

  const setDraft = useCallback((
    patch: Partial<PublishDraft> | ((prev: PublishDraft) => PublishDraft),
    options?: { history?: boolean },
  ) => {
    setHistory((h) => {
      const nextRaw = typeof patch === 'function' ? patch(h.present) : { ...h.present, ...patch };
      const next = withMissing(nextRaw);
      if (JSON.stringify(next) === JSON.stringify(h.present)) return h;
      const record = options?.history !== false;
      const keys = typeof patch === 'function' ? null : Object.keys(patch);
      const textOnly = !!keys && keys.length > 0 && keys.every((key) => TEXT_KEYS.has(key));
      const now = Date.now();
      const coalesce = record && textOnly && now - lastTextPush.current < 700 && h.past.length > 0;
      if (record && !coalesce) lastTextPush.current = now;
      remember(next);
      return {
        present: next,
        past: !record || coalesce ? h.past : [...h.past, h.present].slice(-HISTORY_LIMIT),
        future: record ? [] : h.future,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const present = h.past[h.past.length - 1];
      remember(present);
      return {
        present,
        past: h.past.slice(0, -1),
        future: [h.present, ...h.future].slice(0, HISTORY_LIMIT),
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const [present, ...rest] = h.future;
      remember(present);
      return {
        present,
        past: [...h.past, h.present].slice(-HISTORY_LIMIT),
        future: rest,
      };
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
    const fresh = withMissing(mergeInitialOverSaved({ ...EMPTY_PUBLISH_DRAFT }, initial));
    setHistory({ present: fresh, past: [], future: [] });
    if (persistRef.current) {
      clearPublishDraftStorage();
      saveDraft(fresh);
    }
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
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
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
