'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import PublishTierModal from './PublishTierModal';
import PublishChatInputBar from './PublishChatInputBar';
import {
  calcProgress,
  PublishChatBubble,
  PublishChatHeader,
  PublishChatInlineOptions,
  PublishChatSummary,
  PublishChatTyping,
  type ChatMessageView,
} from './PublishChatUI';
import { usePublishActions } from '@/hooks/usePublishActions';
import { useAuth } from '@/hooks/useAuth';
import { Categoria } from '@/types';
import {
  botQuestion,
  CATEGORIA_OPTIONS,
  draftToPublishText,
  inferCategory,
  PRECIO_OPTIONS,
  PublishChatDraft,
  PublishChatStepId,
  resolveCategoriaFromText,
  STEP_ORDER,
} from '@/lib/publish/chat-steps';
import { evaluatePublishInput } from '@/lib/publish/PublishCoachEngine';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  step?: PublishChatStepId;
  imageUrl?: string;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatAnswer(step: PublishChatStepId, value: string, draft: PublishChatDraft): string {
  if (step === 'categoria') {
    const opt = CATEGORIA_OPTIONS.find((c) => c.value === value);
    return opt ? opt.label : value;
  }
  if (step === 'precio') {
    if (value === 'skip') return 'Sin precio';
    const opt = PRECIO_OPTIONS.find((p) => p.value === value);
    if (opt) return opt.label;
    return value.startsWith('S/') ? value : `S/ ${value}`;
  }
  if (step === 'foto') {
    if (value === 'skip') return 'Sin foto';
    return draft.imageUrl ? 'Foto adjunta' : value;
  }
  return value;
}

interface PublishChatWizardProps {
  compact?: boolean;
  initialText?: string;
  initialImageUrl?: string | null;
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  onPublished?: () => void;
}

export default function PublishChatWizard({
  compact = false,
  initialText = '',
  initialImageUrl = null,
  onNotify,
  onPublished,
}: PublishChatWizardProps) {
  const { profile } = useAuth();
  const {
    publishImageUrl,
    setPublishImageUrl,
    uploadingImage,
    publishing,
    loadingTier,
    uploadPublishImage,
    publishFree,
    publishProRedirect,
  } = usePublishActions(onNotify);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<PublishChatDraft>({
    categoria: 'productos',
    titulo: '',
    descripcion: '',
    precio: '',
    ubicacion: '',
    contacto: profile?.telefono || '',
    imageUrl: initialImageUrl || undefined,
  });
  const [currentStep, setCurrentStep] = useState<PublishChatStepId | 'done'>('categoria');
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepAttemptsRef = useRef<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);

  const scrollBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const addBot = useCallback((content: string, step?: PublishChatStepId) => {
    setMessages((m) => [...m, { id: uid(), role: 'assistant', content, step }]);
  }, []);

  const addUser = useCallback((content: string, step: PublishChatStepId, imageUrl?: string) => {
    setMessages((m) => [...m, { id: uid(), role: 'user', content, step, imageUrl }]);
  }, []);

  const askStep = useCallback(
    async (step: PublishChatStepId) => {
      setTyping(true);
      await delay(500 + Math.random() * 600);
      setTyping(false);
      addBot(botQuestion(step), step);
      setCurrentStep(step);
      scrollBottom();
    },
    [addBot],
  );

  const startConversation = useCallback(async () => {
    if (started) return;
    setStarted(true);
    setTyping(true);
    await delay(400);
    setTyping(false);
    addBot('¡Hola! Soy ADIS. Cuéntame qué quieres publicar y te ayudaré a crear tu adiso 😊');
    await delay(300);
    await askStep('categoria');
  }, [started, addBot, askStep]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void startConversation();
  }, [startConversation]);

  useEffect(() => {
    if (profile?.telefono && !draft.contacto) {
      setDraft((d) => ({ ...d, contacto: profile.telefono! }));
    }
  }, [profile?.telefono, draft.contacto]);

  useEffect(() => {
    if (initialImageUrl) setPublishImageUrl(initialImageUrl);
  }, [initialImageUrl, setPublishImageUrl]);

  const advanceAfterAnswer = async (step: PublishChatStepId, nextDraft: PublishChatDraft) => {
    const idx = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[idx + 1];
    if (!next) {
      setCurrentStep('done');
      setTyping(true);
      await delay(600);
      setTyping(false);
      addBot('¡Listo! Revisa tu aviso y elige cómo publicarlo.');
      scrollBottom();
      return;
    }
    if (next === 'foto' && (nextDraft.imageUrl || publishImageUrl)) {
      const img = nextDraft.imageUrl || publishImageUrl!;
      setDraft((d) => ({ ...d, imageUrl: img }));
      addUser('Foto adjunta ✓', 'foto');
      await advanceAfterAnswer('foto', { ...nextDraft, imageUrl: img });
      return;
    }
    await askStep(next);
  };

  const applyAnswer = async (
    step: PublishChatStepId,
    rawValue: string,
    imageUrl?: string,
    userDisplay?: string,
  ) => {
    const value = rawValue.trim();
    if (!value && step !== 'foto' && step !== 'precio') return;

    let nextDraft = { ...draft };

    switch (step) {
      case 'categoria':
        nextDraft.categoria = value as Categoria;
        break;
      case 'titulo':
        nextDraft.titulo = value.slice(0, 100);
        break;
      case 'descripcion':
        nextDraft.descripcion = value;
        break;
      case 'precio':
        nextDraft.precio = value;
        break;
      case 'ubicacion':
        nextDraft.ubicacion = value;
        break;
      case 'contacto':
        nextDraft.contacto = value;
        break;
      case 'foto':
        if (value !== 'skip' && (imageUrl || publishImageUrl)) {
          nextDraft.imageUrl = imageUrl || publishImageUrl || undefined;
        }
        break;
    }

    setDraft(nextDraft);
    const display =
      userDisplay ?? formatAnswer(step, value, nextDraft);
    addUser(display, step, nextDraft.imageUrl);
    setInput('');
    scrollBottom();

    if (
      step === 'categoria' &&
      userDisplay &&
      userDisplay !== formatAnswer(step, value, nextDraft)
    ) {
      setTyping(true);
      await delay(400);
      setTyping(false);
      addBot(
        `Tiene sentido — lo ubico en ${formatAnswer(step, value, nextDraft)} según lo que comentas.`,
      );
      scrollBottom();
    }

    await advanceAfterAnswer(step, nextDraft);
  };

  const fastForwardFromComposer = useCallback(
    async (text: string, imageUrl?: string | null) => {
      if (!text.trim()) return;
      const cat = inferCategory(text);
      const titleGuess = text.trim().slice(0, 80);
      const nextDraft: PublishChatDraft = {
        ...draft,
        categoria: cat,
        descripcion: text.trim(),
        titulo: draft.titulo || titleGuess,
        imageUrl: imageUrl || draft.imageUrl,
      };
      if (imageUrl) setPublishImageUrl(imageUrl);

      const catLabel = CATEGORIA_OPTIONS.find((c) => c.value === cat);
      setDraft(nextDraft);
      setTyping(true);
      await delay(400);
      setTyping(false);
      addUser(catLabel?.label ?? cat, 'categoria');
      await delay(350);
      addUser(nextDraft.titulo, 'titulo');
      await delay(350);
      const preview =
        text.trim().length > 200 ? `${text.trim().slice(0, 200)}…` : text.trim();
      addUser(preview, 'descripcion');
      scrollBottom();
      await askStep('precio');
    },
    [draft, addUser, askStep, setPublishImageUrl],
  );

  useEffect(() => {
    if (!initialText?.trim() || !started) return;
    const timer = setTimeout(() => {
      const answered = messages.some((m) => m.role === 'user');
      if (!answered) void fastForwardFromComposer(initialText, initialImageUrl);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, initialText, initialImageUrl]);

  const handleSend = () => {
    if (typing || currentStep === 'done' || !input.trim()) return;
    const text = input.trim();

    const coach = evaluatePublishInput(
      currentStep,
      text,
      stepAttemptsRef.current[currentStep] ?? 0,
    );
    stepAttemptsRef.current[currentStep] = (stepAttemptsRef.current[currentStep] ?? 0) + 1;

    if (coach.intent === 'off_topic' && coach.message) {
      addBot(coach.message);
      setInput('');
      scrollBottom();
      return;
    }

    if (coach.intent === 'help_request' && coach.message) {
      addBot(coach.message);
    } else if (coach.message && coach.intent === 'needs_ai' && !coach.escalateToAI) {
      addBot(coach.message);
    }

    if (currentStep === 'categoria') {
      const matched = CATEGORIA_OPTIONS.find(
        (c) =>
          c.value === text.toLowerCase() ||
          c.label.toLowerCase() === text.toLowerCase(),
      );
      const cat = matched?.value ?? resolveCategoriaFromText(text);
      void applyAnswer(
        'categoria',
        cat,
        undefined,
        matched ? undefined : text,
      );
      return;
    }

    if (currentStep === 'foto') {
      void applyAnswer('foto', 'skip');
      return;
    }

    void applyAnswer(currentStep, text);
  };

  const handlePublishImage = (file: File) => {
    void uploadPublishImage(file).then((url) => {
      if (!url) return;
      if (currentStep === 'foto') {
        void applyAnswer('foto', 'attached', url);
      }
    });
  };

  const handleOption = (value: string) => {
    if (typing || currentStep === 'done') return;
    void applyAnswer(currentStep, value);
  };

  const startEdit = (msg: ChatMessage) => {
    if (!msg.step || msg.role !== 'user') return;
    setEditingId(msg.id);
    const step = msg.step;
    if (step === 'precio' && msg.content === 'Sin precio') setInput('skip');
    else if (step === 'precio') setInput(msg.content.replace(/^S\/\s*/, ''));
    else if (step === 'categoria') {
      const match = CATEGORIA_OPTIONS.find((c) => msg.content.includes(c.label));
      setInput(match?.value ?? msg.content);
    } else if (step === 'titulo') setInput(draft.titulo);
    else if (step === 'descripcion') setInput(draft.descripcion);
    else if (step === 'ubicacion') setInput(draft.ubicacion);
    else if (step === 'contacto') setInput(draft.contacto);
    else setInput(msg.content);
  };

  const saveEdit = async (msg: ChatMessage) => {
    if (!msg.step || !input.trim()) return;
    const step = msg.step;
    const msgIdx = messages.findIndex((x) => x.id === msg.id);
    setEditingId(null);
    setMessages((m) => m.slice(0, msgIdx));
    setCurrentStep(step);
    await applyAnswer(step, input);
  };

  const handlePublishFree = async () => {
    const text = draftToPublishText(draft);
    const ok = await publishFree(text, draft.contacto, draft.categoria, draft.imageUrl || publishImageUrl || undefined);
    if (ok) {
      setTierModalOpen(false);
      onPublished?.();
    }
  };

  const handlePublishPro = async () => {
    setTierModalOpen(false);
    await publishProRedirect(draftToPublishText(draft), {
      titulo: draft.titulo,
      descripcion: draft.descripcion,
      categoria: draft.categoria,
    }, draft.imageUrl || publishImageUrl || undefined);
  };

  const interactiveStep =
    !typing && currentStep !== 'done' && (currentStep === 'categoria' || currentStep === 'precio' || currentStep === 'foto')
      ? currentStep
      : null;

  const progress = calcProgress(currentStep);

  const inputPlaceholder =
    currentStep === 'categoria'
      ? 'O escribe tu categoría…'
      : currentStep === 'titulo'
        ? 'Ej: iPad Air M2 256 GB'
        : currentStep === 'descripcion'
          ? 'Describe tu aviso…'
          : currentStep === 'contacto'
            ? 'Ej: 987 654 321'
            : currentStep === 'precio'
              ? 'Monto en soles o elige arriba'
              : currentStep === 'ubicacion'
                ? 'Ciudad o distrito…'
                : currentStep === 'foto'
                  ? 'Escribe para continuar sin foto…'
                  : 'Escribe tu mensaje…';

  useEffect(() => {
    scrollBottom();
  }, [messages.length, typing, interactiveStep, currentStep]);

  return (
    <div className={`flex flex-col ${compact ? 'h-full min-h-0' : 'h-full min-h-[480px]'}`}>
      <div
        className={`flex flex-col flex-1 min-h-0 rounded-2xl overflow-hidden shadow-[var(--shadow-lg)] ring-1 ring-black/[0.05] bg-[var(--bg-secondary)]`}
      >
        <PublishChatHeader
          compact={compact}
          typing={typing}
          currentStep={currentStep}
          progress={progress}
        />

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-3 scroll-smooth"
          style={{
            background:
              'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(var(--brand-primary-rgb),0.03) 50%, var(--bg-secondary) 100%)',
          }}
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <PublishChatBubble
                key={msg.id}
                msg={msg as ChatMessageView}
                compact={compact}
                editing={editingId === msg.id}
                editInput={input}
                onEditInputChange={setInput}
                onStartEdit={() => startEdit(msg)}
                onSaveEdit={() => void saveEdit(msg)}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </AnimatePresence>

          {typing && <PublishChatTyping compact={compact} />}

          {interactiveStep && (
            <PublishChatInlineOptions
              step={interactiveStep}
              compact={compact}
              input={input}
              uploading={uploadingImage}
              onInputChange={setInput}
              onSelect={handleOption}
              onConfirmAmount={() => input.trim() && handleOption(input.trim())}
              onPickFile={() => fileRef.current?.click()}
            />
          )}

          {currentStep === 'done' && (
            <PublishChatSummary
              compact={compact}
              draft={draft}
              imageUrl={draft.imageUrl || publishImageUrl}
              onRemoveImage={() => {
                setDraft((d) => ({ ...d, imageUrl: undefined }));
                setPublishImageUrl(null);
              }}
              onPublish={() => setTierModalOpen(true)}
            />
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              void uploadPublishImage(f).then((url) => {
                if (url) void applyAnswer('foto', 'attached', url);
              });
            }
            e.target.value = '';
          }}
        />

        {currentStep !== 'done' && (
          <PublishChatInputBar
            value={input}
            onChange={setInput}
            onSend={handleSend}
            compact={compact}
            disabled={typing}
            placeholder={inputPlaceholder}
            onPublishImage={handlePublishImage}
            publishImageUrl={publishImageUrl}
            publishImageUploading={uploadingImage}
            onRemoveImage={() => setPublishImageUrl(null)}
          />
        )}
      </div>

      <PublishTierModal
        open={tierModalOpen}
        onClose={() => !publishing && setTierModalOpen(false)}
        onChooseFree={() => void handlePublishFree()}
        onChoosePro={() => void handlePublishPro()}
        loading={publishing || loadingTier !== null}
        loadingTier={loadingTier}
      />
    </div>
  );
}
