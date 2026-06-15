'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaPencilAlt, FaPaperPlane } from 'react-icons/fa';
import { IconAdis } from '@/components/Icons';
import PublishTierModal from './PublishTierModal';
import PublishImagePreview from './PublishImagePreview';
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
  STEP_ORDER,
} from '@/lib/publish/chat-steps';

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
    return opt ? `${opt.emoji} ${opt.label}` : value;
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
  /** When user submits from external composer */
  externalSubmit?: { text: string; imageUrl?: string | null } | null;
  onExternalSubmitHandled?: () => void;
}

export default function PublishChatWizard({
  compact = false,
  initialText = '',
  initialImageUrl = null,
  onNotify,
  onPublished,
  externalSubmit,
  onExternalSubmitHandled,
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
    addBot('¡Hola! Soy ADIS. Te ayudo a publicar tu aviso paso a paso. Solo una pregunta a la vez 😊');
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

  const applyAnswer = async (step: PublishChatStepId, rawValue: string, imageUrl?: string) => {
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
    addUser(formatAnswer(step, value, nextDraft), step, nextDraft.imageUrl);
    setInput('');
    scrollBottom();
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
      addUser(`${catLabel?.emoji ?? ''} ${catLabel?.label ?? cat}`, 'categoria');
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
    if (!externalSubmit?.text) return;
    const answered = messages.some((m) => m.role === 'user');
    if (!answered) {
      void fastForwardFromComposer(externalSubmit.text, externalSubmit.imageUrl);
    } else {
      setDraft((d) => ({ ...d, descripcion: externalSubmit.text.trim() }));
      addUser(
        externalSubmit.text.trim().length > 200
          ? `${externalSubmit.text.trim().slice(0, 200)}…`
          : externalSubmit.text.trim(),
        'descripcion',
      );
      if (externalSubmit.imageUrl) setPublishImageUrl(externalSubmit.imageUrl);
      scrollBottom();
    }
    onExternalSubmitHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSubmit]);

  useEffect(() => {
    if (!initialText?.trim() || !started) return;
    const timer = setTimeout(() => {
      const answered = messages.some((m) => m.role === 'user');
      if (!answered) void fastForwardFromComposer(initialText, initialImageUrl);
    }, 800);
    return () => clearTimeout(timer);
    // seed once when landing with URL params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const handleSend = () => {
    if (typing || currentStep === 'done') return;
    if (currentStep === 'foto') return;
    void applyAnswer(currentStep, input);
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

  const showOptions =
    !typing &&
    currentStep !== 'done' &&
    (currentStep === 'categoria' || currentStep === 'precio' || currentStep === 'foto');

  const chatMaxH = compact ? 'max-h-[calc(100vh-220px)]' : 'max-h-[min(520px,55vh)]';

  return (
    <div className={`flex flex-col ${compact ? 'h-full min-h-0' : ''}`}>
      <div
        className={`flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden shadow-sm ${compact ? 'flex-1 min-h-0' : ''}`}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <span className="w-8 h-8 rounded-xl bg-[rgba(var(--brand-yellow-rgb),0.15)] flex items-center justify-center">
            <IconAdis size={16} color="var(--brand-yellow)" />
          </span>
          <div>
            <p className="m-0 text-sm font-bold text-[var(--text-primary)]">ADIS</p>
            <p className="m-0 text-[10px] text-[var(--text-tertiary)]">
              {typing ? 'Escribiendo…' : currentStep === 'done' ? 'Listo para publicar' : 'Asistente de publicación'}
            </p>
          </div>
        </div>

        <div ref={scrollRef} className={`flex-1 overflow-y-auto px-3 py-3 space-y-3 ${chatMaxH}`}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group relative max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-[var(--brand-blue)] text-white rounded-br-md'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-md border border-[var(--border-color)]'
                }`}
              >
                {editingId === msg.id ? (
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full rounded-lg px-2 py-1 text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(msg)}
                        className="flex-1 py-1 rounded-lg bg-white/20 text-xs font-semibold"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-1 rounded-lg bg-black/10 text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="m-0 whitespace-pre-wrap break-words">{msg.content}</p>
                    {msg.imageUrl && (
                      <PublishImagePreview url={msg.imageUrl} onRemove={() => {}} size="sm" />
                    )}
                    {msg.role === 'user' && msg.step && editingId !== msg.id && (
                      <button
                        type="button"
                        onClick={() => startEdit(msg)}
                        className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-sm transition-opacity"
                        aria-label="Editar"
                      >
                        <FaPencilAlt size={10} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          {currentStep === 'done' && (
            <div className="rounded-xl border border-[var(--border-color)] p-3 bg-[var(--bg-secondary)] text-sm space-y-2">
              <p className="m-0 font-bold text-[var(--text-primary)]">{draft.titulo || 'Sin título'}</p>
              <p className="m-0 text-xs text-[var(--text-secondary)] line-clamp-3">{draft.descripcion}</p>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="px-2 py-0.5 rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]">
                  {CATEGORIA_OPTIONS.find((c) => c.value === draft.categoria)?.label}
                </span>
                {draft.ubicacion && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-tertiary)]">
                    📍 {draft.ubicacion}
                  </span>
                )}
              </div>
              {(draft.imageUrl || publishImageUrl) && (
                <PublishImagePreview
                  url={draft.imageUrl || publishImageUrl!}
                  onRemove={() => {
                    setDraft((d) => ({ ...d, imageUrl: undefined }));
                    setPublishImageUrl(null);
                  }}
                  size="sm"
                />
              )}
              <button
                type="button"
                onClick={() => setTierModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-[var(--brand-yellow)] text-[#1c1608] font-bold text-sm shadow-[0_2px_10px_rgba(var(--brand-yellow-rgb),0.35)]"
              >
                Publicar aviso
              </button>
            </div>
          )}
        </div>

        {currentStep !== 'done' && !typing && (
          <div className="border-t border-[var(--border-color)] p-3 space-y-2 bg-[var(--bg-primary)]">
            {showOptions && currentStep === 'categoria' && (
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIA_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleOption(opt.value)}
                    className="px-2.5 py-1.5 rounded-full text-xs font-semibold border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] transition-colors"
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            )}

            {showOptions && currentStep === 'precio' && (
              <div className="flex flex-wrap gap-1.5">
                {PRECIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleOption(opt.value)}
                    className="px-2.5 py-1.5 rounded-full text-xs font-semibold border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--brand-blue)] transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {showOptions && currentStep === 'foto' && (
              <div className="flex flex-wrap gap-1.5 items-center">
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
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileRef.current?.click()}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--brand-blue)] text-[var(--brand-blue)]"
                >
                  {uploadingImage ? 'Subiendo…' : '📷 Adjuntar foto'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOption('skip')}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[var(--border-color)] text-[var(--text-secondary)]"
                >
                  Continuar sin foto
                </button>
              </div>
            )}

            {!showOptions && (
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={compact ? 1 : 2}
                  placeholder={
                    currentStep === 'titulo'
                      ? 'Ej: Casa de 2 pisos en venta'
                      : currentStep === 'contacto'
                        ? 'Ej: 987 654 321'
                        : 'Escribe tu respuesta…'
                  }
                  className="flex-1 resize-none rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-primary-rgb),0.3)]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="shrink-0 w-10 h-10 rounded-xl bg-[var(--brand-blue)] text-white flex items-center justify-center disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <FaPaperPlane size={14} />
                </button>
              </div>
            )}

            {showOptions && currentStep === 'precio' && (
              <div className="flex gap-2 items-end pt-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={input}
                  onChange={(e) => setInput(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="O escribe un monto (ej: 1500)"
                  className="flex-1 rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm bg-[var(--bg-secondary)]"
                />
                <button
                  type="button"
                  onClick={() => input.trim() && handleOption(input.trim())}
                  disabled={!input.trim()}
                  className="shrink-0 px-3 py-2 rounded-xl bg-[var(--brand-blue)] text-white text-xs font-bold disabled:opacity-40"
                >
                  OK
                </button>
              </div>
            )}
          </div>
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
