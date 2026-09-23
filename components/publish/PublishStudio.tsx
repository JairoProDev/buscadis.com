'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import {
  usePublishDraft,
  loadStudioStep,
  saveStudioStep,
  type StudioStep,
} from '@/hooks/usePublishDraft';
import { usePublishActions } from '@/hooks/usePublishActions';
import { getMyBusinessViaAPI } from '@/lib/business-api';
import PublishFormCompact from './PublishFormCompact';
import PublishReviewStep from './PublishReviewStep';
import PublishCheckoutPanel from './PublishCheckoutPanel';
import PublishFixedChatBar from './PublishFixedChatBar';
import PublishStepIndicator from './PublishStepIndicator';
import PublishAIQuestions from './PublishAIQuestions';
import type { PublisherPreview } from './PublishPreviewCard';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { hasMinimumContent } from '@/lib/publish/publish-draft-types';
import { publishPrimaryBtn, publishSecondaryBtn, publishCard } from './publish-ui';
import { IconCamera, IconImage, IconLayers, IconMegaphone, IconMicrophone, IconSend, IconX } from '@/components/Icons';
import type { Adiso } from '@/types';
import { FLYER_TEMPLATES, defaultFlyerForCategory, resolveFlyerConfig } from '@/lib/flyer/templates';
import { exportAndUploadFlyer } from '@/lib/flyer/export-client';
import type { FlyerConfig, FlyerTemplateId } from '@/lib/flyer/types';
import FlyerCanvas from '@/components/flyer/FlyerCanvas';
import { buildFlyerContent } from '@/lib/flyer/layout';
import { downloadCoverImage } from '@/lib/publish/download-cover';
import FlyerTemplatePicker from '@/components/flyer/FlyerTemplatePicker';
import PublishCoverEditor, { type CoverTool, type PublishCoverEditorHandle } from './PublishCoverEditor';

export const STORIES_REFRESH_EVENT = 'buscadis:stories-refresh';

interface PublishStudioProps {
  initialText?: string;
  initialImageUrl?: string | null;
  initialContacto?: string;
  compact?: boolean;
  immersive?: boolean;
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  onPublished?: (adiso: Adiso) => void;
  onClose?: () => void;
}

function draftHasAiFields(patch: Partial<PublishDraft>): boolean {
  return Boolean(
    patch.titulo?.trim() ||
      patch.descripcion?.trim() ||
      patch.contacto?.trim() ||
      patch.categoria ||
      patch.precio != null ||
      (patch.atributos && Object.keys(patch.atributos).length > 0)
  );
}

export default function PublishStudio({
  initialText = '',
  initialImageUrl = null,
  initialContacto,
  compact = false,
  immersive = false,
  onNotify,
  onPublished,
  onClose,
}: PublishStudioProps) {
  const { user, session } = useAuth();
  const { openAuthModal } = useUI();
  const {
    draft,
    setDraft,
    mergeDraft,
    setAtributo,
    addImage,
    removeImage,
    showAdvanced,
    setShowAdvanced,
    resetDraft,
    undo,
    redo,
    canUndo,
    canRedo,
    addChatMessage,
  } = usePublishDraft({
    descripcion: initialText,
    contacto: initialContacto,
    imagenes: initialImageUrl ? [initialImageUrl] : [],
  });

  const { uploadPublishImage, uploadingImage } = usePublishActions(onNotify);
  const [step, setStepState] = useState<StudioStep>(() => loadStudioStep());
  const [analyzing, setAnalyzing] = useState(false);
  const [chatStatus, setChatStatus] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [enhancingField, setEnhancingField] = useState<'titulo' | 'descripcion' | null>(null);
  const [publishedOrderId, setPublishedOrderId] = useState<string | null>(null);
  const [publishedAdisoId, setPublishedAdisoId] = useState<string | null>(null);
  const [publisher, setPublisher] = useState<PublisherPreview | null>(null);
  const [autoDownload, setAutoDownload] = useState(true);
  const [showUpsell, setShowUpsell] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [coverTool, setCoverTool] = useState<CoverTool>(null);
  const [composerText, setComposerText] = useState('');
  const coverEditorRef = useRef<PublishCoverEditorHandle>(null);
  const flyerExportRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { isListening, isSupported, start: startVoice, stop: stopVoice } = useSpeechRecognition('es-PE');

  useEffect(() => {
    if (draft.flyerTemplateId) return;
    const d = defaultFlyerForCategory(draft.categoria);
    setDraft({ flyerTemplateId: d.templateId, flyerConfig: d.config }, { history: false });
  }, [draft.categoria, draft.flyerTemplateId, setDraft]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const meta = event.metaKey || event.ctrlKey;
      if (!meta || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const hasWork = Boolean(
    draft.titulo?.trim() ||
      draft.descripcion?.trim() ||
      draft.contacto?.trim() ||
      draft.imagenes.length ||
      draft.precio != null ||
      draft.categoria ||
      draft.chatHistory.length ||
      Object.keys(draft.atributos || {}).length ||
      (draft.flyerTemplateId &&
        draft.flyerTemplateId !== defaultFlyerForCategory(draft.categoria).templateId) ||
      (draft.flyerConfig &&
        JSON.stringify(draft.flyerConfig) !==
          JSON.stringify(defaultFlyerForCategory(draft.categoria).config))
  );

  const requestLeave = () => {
    if (!onClose) return;
    if (!hasWork) {
      onClose();
      return;
    }
    setConfirmLeave(true);
  };

  const setStep = useCallback((next: StudioStep) => {
    setStepState(next);
    saveStudioStep(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMyBusinessViaAPI()
      .then((profile) => {
        if (cancelled || !profile) return;
        setPublisher({
          name: profile.name || undefined,
          logoUrl: profile.logo_url || undefined,
        });
      })
      .catch(() => {
        /* optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runAnalyze = useCallback(
    async (opts: { text?: string; imageUrl?: string; source: 'chat' | 'photo' | 'voice' }) => {
      const text = opts.text?.trim();
      const imageUrl = opts.imageUrl;
      if (!text && !imageUrl) return false;

      setAnalyzing(true);
      setChatStatus(null);
      try {
        const imageUrls = imageUrl
          ? [imageUrl, ...draft.imagenes.filter((u) => u !== imageUrl)]
          : draft.imagenes.length > 0
            ? draft.imagenes
            : undefined;

        const res = await fetch('/api/publish/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            text: text || undefined,
            imageUrls,
            currentDraft: {
              categoria: draft.categoria,
              titulo: draft.titulo,
              descripcion: draft.descripcion,
              atributos: draft.atributos,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data.error || 'No se pudo analizar';
          setChatStatus(msg);
          onNotify?.(msg, 'error');
          return false;
        }

        if (data.draft && draftHasAiFields(data.draft)) {
          mergeDraft(data.draft, data.confidence);
          const msg =
            opts.source === 'photo'
              ? 'Listo: extraje datos de tu foto.'
              : opts.source === 'voice'
                ? 'Listo: convertí tu audio en aviso.'
                : 'Listo, actualicé tu aviso.';
          addChatMessage('assistant', msg);
          setChatStatus(msg);
          onNotify?.('Aviso actualizado por ADIS', 'success');
          return true;
        }

        const emptyMsg = 'No pude extraer suficiente info. Prueba otra foto o dicta más detalles.';
        addChatMessage('assistant', emptyMsg);
        setChatStatus(emptyMsg);
        onNotify?.(emptyMsg, 'info');
        return false;
      } catch {
        const msg = 'No se pudo procesar. Intenta de nuevo.';
        setChatStatus(msg);
        onNotify?.(msg, 'error');
        return false;
      } finally {
        setAnalyzing(false);
      }
    },
    [
      draft.imagenes,
      draft.categoria,
      draft.titulo,
      draft.descripcion,
      draft.atributos,
      mergeDraft,
      addChatMessage,
      onNotify,
      session?.access_token,
    ]
  );

  const handleChatSend = useCallback(
    async (text: string, imageUrl?: string) => {
      if (imageUrl) addImage(imageUrl);
      if (!text.trim() && !imageUrl) return;
      addChatMessage('user', text.trim() || '(imagen adjunta)');
      await runAnalyze({ text, imageUrl, source: 'chat' });
    },
    [addImage, addChatMessage, runAnalyze]
  );

  const handlePhotoAdded = useCallback(
    (url: string) => {
      addImage(url);
      void runAnalyze({ imageUrl: url, source: 'photo' });
    },
    [addImage, runAnalyze]
  );

  const handleFilePick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const url = await uploadPublishImage(file);
    if (url) handlePhotoAdded(url);
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const [recordingAudio, setRecordingAudio] = useState(false);

  const transcribeViaServer = useCallback(
    async (blob: Blob) => {
      setAnalyzing(true);
      try {
        const fd = new FormData();
        fd.append('audio', blob, `dictado-${Date.now()}.webm`);
        const res = await fetch('/api/publish/stt', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'STT falló');
        const text = String(data.text || '').trim();
        if (!text) throw new Error('Audio vacío');
        addChatMessage('user', text);
        await runAnalyze({ text, source: 'voice' });
      } catch (e) {
        onNotify?.(e instanceof Error ? e.message : 'No se pudo transcribir', 'error');
        setAnalyzing(false);
      }
    },
    [addChatMessage, runAnalyze, onNotify]
  );

  const handleVoiceCapture = async () => {
    if (isListening) {
      stopVoice();
      return;
    }
    if (recordingAudio && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingAudio(false);
      return;
    }

    if (isSupported) {
      startVoice(
        (transcript) => {
          addChatMessage('user', transcript);
          void runAnalyze({ text: transcript, source: 'voice' });
        },
        (message) => onNotify?.(message, 'error')
      );
      return;
    }

    // Fallback: MediaRecorder → /api/publish/stt
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) mediaChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(mediaChunksRef.current, { type: 'audio/webm' });
        void transcribeViaServer(blob);
      };
      recorder.start();
      setRecordingAudio(true);
      onNotify?.('Grabando… toca de nuevo para terminar', 'info');
    } catch {
      onNotify?.('No se pudo acceder al micrófono', 'error');
    }
  };

  const handleEnhanceField = useCallback(
    async (field: 'titulo' | 'descripcion') => {
      const value = field === 'titulo' ? draft.titulo : draft.descripcion;
      if (!value?.trim()) return;
      setEnhancingField(field);
      try {
        const res = await fetch('/api/catalog/enhance-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze',
            field,
            text: value,
            title: draft.titulo,
            description: draft.descripcion,
          }),
        });
        const json = await res.json();
        const enhanced = json.enhanced || json[field] || json.title || json.description;
        if (enhanced) setDraft({ [field]: enhanced });
      } catch {
        onNotify?.('No se pudo mejorar el campo', 'error');
      } finally {
        setEnhancingField(null);
      }
    },
    [draft.titulo, draft.descripcion, setDraft, onNotify]
  );

  const publish = useCallback(
    async (plan: 'free' | 'paid') => {
      if (!user?.id) {
        openAuthModal();
        return;
      }
      if (!hasMinimumContent(draft)) {
        onNotify?.('Agrega título, descripción o al menos una imagen', 'error');
        return;
      }

      const publishDraft: PublishDraft =
        plan === 'free' ? { ...draft, imagenes: draft.imagenes.slice(0, 1) } : draft;

      setPublishing(true);
      try {
        let imagenes = [...publishDraft.imagenes];
        let flyerTemplateId = publishDraft.flyerTemplateId;
        let flyerConfig = publishDraft.flyerConfig;
        let coverForDownload: string | null = imagenes[0] || null;

        const editor = coverEditorRef.current;
        if (editor && (editor.hasEdits() || editor.cropPending())) {
          const blob = await editor.exportJpeg();
          if (blob) {
            const baked = await uploadPublishImage(
              new File([blob], `portada-${Date.now()}.jpg`, { type: 'image/jpeg' }),
            );
            if (baked) {
              imagenes = [baked, ...imagenes.slice(1)];
              coverForDownload = baked;
            }
          }
        }

        if (imagenes.length === 0) {
          const defaults = defaultFlyerForCategory(publishDraft.categoria);
          flyerTemplateId = flyerTemplateId || defaults.templateId;
          flyerConfig = flyerConfig || defaults.config;
          await new Promise((r) => requestAnimationFrame(() => r(null)));
          const coverUrl = await exportAndUploadFlyer(flyerExportRef.current);
          if (coverUrl) {
            imagenes = [coverUrl];
            coverForDownload = coverUrl;
          } else {
            onNotify?.('No se pudo generar la portada; el aviso usará el flyer en pantalla.', 'info');
          }
        }

        const res = await fetch('/api/adisos/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            ...publishDraft,
            imagenes,
            flyerTemplateId,
            flyerConfig,
            plan,
            paidDays: publishDraft.paidDays ?? 7,
            dailyRate: publishDraft.dailyRate ?? 5,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al publicar');

        const created = data.adiso as Adiso | undefined;
        if (created) {
          if (publisher && !created.vendedor) {
            created.vendedor = {
              id: created.user_id || created.usuario_id || 'me',
              nombre: publisher.name || 'Tu negocio',
              avatarUrl: publisher.logoUrl,
              esVerificado: true,
              nivelVerificacion: 'negocio',
            };
          }
          onPublished?.(created);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(STORIES_REFRESH_EVENT));
          }
        }

        if (autoDownload && coverForDownload) {
          void downloadCoverImage(coverForDownload, `buscadis-${created?.id || 'aviso'}.jpg`);
        }

        if (plan === 'paid') {
          setPublishedAdisoId(data.adiso?.id);
          setPublishedOrderId(data.orderId);
          setStep('pay');
          onNotify?.('¡Ya está en el feed! Verifica tu pago Yape para activar el contacto.', 'success');
        } else {
          onNotify?.('¡Publicado! Ya aparece en el feed (gratis 24h).', 'success');
          setShowUpsell(true);
          setPublishedAdisoId(data.adiso?.id || null);
          resetDraft();
          setStep('compose');
        }
      } catch (e) {
        onNotify?.(e instanceof Error ? e.message : 'Error al publicar', 'error');
      } finally {
        setPublishing(false);
      }
    },
    [
      user?.id,
      draft,
      session?.access_token,
      openAuthModal,
      onNotify,
      resetDraft,
      onPublished,
      setStep,
      publisher,
      autoDownload,
      uploadPublishImage,
    ]
  );

  const handleAiAnswer = (fieldId: string, value: string | number | boolean) => {
    if (fieldId === 'titulo' || fieldId === 'descripcion' || fieldId === 'contacto') {
      setDraft({ [fieldId]: String(value) });
    } else if (fieldId === 'precio') {
      setDraft({ precio: typeof value === 'number' ? value : Number(value) || undefined });
    } else if (fieldId === 'categoria') {
      setDraft({ categoria: value as PublishDraft['categoria'] });
    } else {
      setAtributo(fieldId, value);
    }
  };

  const stepNumber = step === 'compose' ? 1 : step === 'review' ? 2 : 3;
  const showChat = !immersive;

  const flyerDefaults = defaultFlyerForCategory(draft.categoria);
  const exportTemplateId = draft.flyerTemplateId || flyerDefaults.templateId;
  const exportConfig = resolveFlyerConfig(
    draft.categoria,
    exportTemplateId,
    draft.flyerConfig || flyerDefaults.config
  );
  const exportContent = buildFlyerContent({
    titulo: draft.titulo || 'Aviso en Buscadis',
    precio: draft.precio,
    moneda: draft.moneda,
    tipoPrecio: draft.tipoPrecio,
    ubicacion: draft.ubicacion,
    categoria: draft.categoria,
  });

  const heroUrl = draft.imagenes[0];
  const canPublish = hasMinimumContent(draft) && !analyzing && !publishing;

  return (
    <div
      className={`relative flex flex-col ${
        immersive || compact ? 'h-full min-h-0' : 'min-h-0'
      } ${showChat && step === 'compose' && !compact && !immersive ? 'pb-[120px]' : ''}`}
    >
      {draft.imagenes.length === 0 && (
        <div aria-hidden className="pointer-events-none fixed left-[-9999px] top-0 w-[1080px] opacity-0">
          <FlyerCanvas
            templateId={exportTemplateId}
            config={exportConfig}
            content={exportContent}
            exportRef={flyerExportRef}
          />
        </div>
      )}

      {onClose && !immersive && (
        <div className="mb-2 flex shrink-0 items-center justify-between px-1">
          <h2 className="m-0 text-base font-bold text-[var(--text-primary)]">Publicar aviso</h2>
          <button
            type="button"
            onClick={requestLeave}
            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--hover-bg)]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}

      {!immersive && <PublishStepIndicator step={stepNumber} />}

      {step === 'compose' && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={immersive ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'min-h-0 flex-1 overflow-y-auto px-3 pb-3'}>
            {immersive ? (
              <PublishCoverEditor
                ref={coverEditorRef}
                onLeave={requestLeave}
                onNotify={onNotify}
                heroUrl={heroUrl}
                titulo={draft.titulo}
                descripcion={draft.descripcion}
                onTitle={(value) => setDraft({ titulo: value })}
                onDescription={(value) => setDraft({ descripcion: value })}
                autoDownload={autoDownload}
                onAutoDownload={setAutoDownload}
                templatesOpen={showTemplates}
                onOpenTemplates={() => {
                  setShowTemplates((open) => !open);
                  setCoverTool(null);
                }}
                onReplaceCover={async (file) => {
                  const url = await uploadPublishImage(file);
                  if (!url) return;
                  setDraft((prev) => ({
                    ...prev,
                    imagenes: [url, ...prev.imagenes.slice(1)],
                  }));
                  return url;
                }}
                tool={coverTool}
                onTool={(next) => {
                  setCoverTool(next);
                  if (next) setShowTemplates(false);
                }}
              >
                {heroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroUrl} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0">
                    <FlyerCanvas
                      templateId={exportTemplateId}
                      config={exportConfig}
                      content={exportContent}
                      className="h-full w-full"
                    />
                  </div>
                )}
              </PublishCoverEditor>
            ) : (
            <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-2xl bg-[var(--bg-secondary)]">
              {heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0">
                  <FlyerCanvas
                    templateId={exportTemplateId}
                    config={exportConfig}
                    content={exportContent}
                    className="h-full w-full"
                  />
                </div>
              )}

              {heroUrl && (
                <button
                  type="button"
                  onClick={() => removeImage(heroUrl)}
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white"
                  aria-label="Quitar foto"
                  title="Quitar foto"
                >
                  <IconX size={14} />
                </button>
              )}
            </div>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                void handleFilePick(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void handleFilePick(e.target.files);
                e.target.value = '';
              }}
            />

            {(analyzing || chatStatus) && (
              <p className="mb-2 text-center text-xs font-medium text-[var(--text-secondary)]" aria-live="polite">
                {analyzing ? 'ADIS está analizando…' : chatStatus}
              </p>
            )}

            {!immersive && draft.imagenes.length > 1 && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {draft.imagenes.slice(1).map((url) => (
                  <div key={url} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-[var(--border-color)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white"
                      aria-label="Quitar foto"
                    >
                      <IconX size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!immersive && draft.missingFields.length > 0 && (
              <div className="mb-3">
                <PublishAIQuestions draft={draft} onAnswer={handleAiAnswer} />
              </div>
            )}

            {!immersive && (
            <PublishFormCompact
              draft={draft}
              onChange={setDraft}
              onSetAtributo={setAtributo}
              showAdvanced={showAdvanced}
              onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
              onEnhanceField={handleEnhanceField}
              enhancingField={enhancingField}
              analyzing={analyzing}
              autoDownload={autoDownload}
              onAutoDownloadChange={setAutoDownload}
            />
            )}

            {!immersive && showChat && (
              <PublishFixedChatBar
                onSend={handleChatSend}
                onUploadImage={uploadPublishImage}
                sending={analyzing}
                embedded
                statusMessage={chatStatus}
              />
            )}
          </div>

          <div className="shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-primary)] pb-[max(0.35rem,env(safe-area-inset-bottom))]">
            {showTemplates && (
              <div className={immersive ? 'shrink-0 px-3 pb-2' : 'max-h-[42vh] overflow-y-auto border-b border-[var(--border-color)] px-3 py-3'}>
                {immersive ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {FLYER_TEMPLATES.map((template) => {
                      const selected = template.id === exportTemplateId;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() =>
                            setDraft({
                              flyerTemplateId: template.id,
                              flyerConfig: resolveFlyerConfig(draft.categoria, template.id, {
                                ...exportConfig,
                                ...template.defaultConfig,
                              }),
                            })
                          }
                          className={`w-14 shrink-0 overflow-hidden rounded-xl ring-2 ${
                            selected ? 'ring-[var(--brand-blue)]' : 'ring-transparent'
                          }`}
                          aria-label={template.label}
                        >
                          <FlyerCanvas
                            templateId={template.id}
                            config={resolveFlyerConfig(draft.categoria, template.id, {
                              ...exportConfig,
                              ...template.defaultConfig,
                            })}
                            content={exportContent}
                            density="compact"
                            className="pointer-events-none"
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                <FlyerTemplatePicker
                  templateId={exportTemplateId}
                  config={exportConfig}
                  content={exportContent}
                  hidePreview
                  onChange={(next) =>
                    setDraft({ flyerTemplateId: next.templateId, flyerConfig: next.config })
                  }
                />
                )}
              </div>
            )}
            <div className="shrink-0 bg-[var(--bg-primary)] pb-[max(0.35rem,env(safe-area-inset-bottom))]">
            {immersive ? (
              <form
                className="flex items-center gap-1.5 px-2 pt-1"
                onSubmit={(event) => {
                  event.preventDefault();
                  const text = composerText.trim();
                  if (text) {
                    setComposerText('');
                    void handleChatSend(text);
                    return;
                  }
                  void publish('free');
                }}
              >
                <div className="flex min-w-0 flex-1 items-center rounded-full bg-[var(--bg-secondary)] pl-4 pr-1">
                  <input
                    value={composerText}
                    onChange={(event) => setComposerText(event.target.value)}
                    placeholder="Escribe un mensaje"
                    className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
                    aria-label="Mensaje"
                  />
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploadingImage || analyzing}
                    className="flex h-10 w-10 items-center justify-center text-[var(--text-secondary)] disabled:opacity-40"
                    aria-label="Tomar foto"
                    title="Tomar foto"
                  >
                    <IconCamera size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadingImage || analyzing}
                    className="flex h-10 w-10 items-center justify-center text-[var(--text-secondary)] disabled:opacity-40"
                    aria-label="Enviar foto"
                    title="Enviar foto"
                  >
                    <IconImage size={18} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void handleVoiceCapture()}
                  disabled={analyzing}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    isListening || recordingAudio
                      ? 'animate-pulse bg-red-500 text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                  }`}
                  aria-label={isListening || recordingAudio ? 'Detener audio' : 'Enviar audio'}
                  title={isListening || recordingAudio ? 'Detener' : 'Audio'}
                >
                  <IconMicrophone size={18} />
                </button>
                <button
                  type="submit"
                  disabled={publishing || analyzing}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1dab61] text-white disabled:opacity-40"
                  aria-label={composerText.trim() ? 'Enviar mensaje' : 'Publicar'}
                  title={composerText.trim() ? 'Enviar' : 'Publicar'}
                >
                  <IconSend size={16} />
                </button>
              </form>
            ) : (
            <div className="flex items-center justify-between px-4 py-2">
              <button
                type="button"
                onClick={() => {
                  setShowTemplates((open) => !open);
                  setCoverTool(null);
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  showTemplates
                    ? 'bg-[var(--brand-blue)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                }`}
                aria-label="Plantillas"
                aria-pressed={showTemplates}
                title="Plantillas"
              >
                <IconLayers size={20} />
              </button>
              <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadingImage || analyzing}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-lg disabled:opacity-40"
                aria-label="Tomar foto"
                title="Tomar foto"
              >
                <IconCamera size={24} />
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingImage || analyzing}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] disabled:opacity-40"
                aria-label="Subir foto"
                title="Subir foto"
              >
                <IconImage size={20} />
              </button>
              <button
                type="button"
                onClick={() => void handleVoiceCapture()}
                disabled={analyzing}
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isListening || recordingAudio
                    ? 'animate-pulse bg-red-500 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                }`}
                aria-label={isListening || recordingAudio ? 'Detener dictado' : 'Dictar aviso'}
                aria-pressed={isListening || recordingAudio}
                title={isListening || recordingAudio ? 'Detener' : 'Dictar'}
              >
                <IconMicrophone size={20} />
              </button>
              <button
                type="button"
                onClick={() => void publish('free')}
                disabled={!canPublish}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-lg disabled:opacity-40"
                aria-label={publishing ? 'Publicando' : 'Publicar'}
                title={publishing ? 'Publicando…' : 'Publicar'}
              >
                <IconMegaphone size={20} />
              </button>
              </div>
            </div>
            )}
          </div>

          {showUpsell && (
            <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-black/40 p-4 sm:items-center">
              <div className={`${publishCard} w-full max-w-md space-y-3 p-4`}>
                <p className="m-0 text-base font-bold text-[var(--text-primary)]">¡Publicado!</p>
                <p className="m-0 text-sm text-[var(--text-secondary)]">
                  Tu aviso ya está en el feed. ¿Quieres más fotos, más días o más visibilidad?
                </p>
                <button
                  type="button"
                  className={publishPrimaryBtn}
                  onClick={() => {
                    setShowUpsell(false);
                    setStep('pay');
                  }}
                >
                  Ver beneficios extra
                </button>
                <button
                  type="button"
                  className={publishSecondaryBtn}
                  onClick={() => setShowUpsell(false)}
                >
                  Seguir gratis
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="flex min-h-0 flex-1 flex-col px-3">
          <div className="min-h-0 flex-1 overflow-y-auto pb-3">
            <PublishReviewStep draft={draft} publisher={publisher} />
          </div>
          <div className="shrink-0 space-y-2 border-t border-[var(--border-color)] pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button type="button" onClick={() => void publish('free')} className={publishPrimaryBtn} disabled={publishing}>
              {publishing ? 'Publicando…' : 'Publicar gratis'}
            </button>
            <button type="button" onClick={() => setStep('pay')} className={publishSecondaryBtn}>
              Destacar (beneficios extra)
            </button>
            <button type="button" onClick={() => setStep('compose')} className={publishSecondaryBtn}>
              ← Volver a editar
            </button>
          </div>
        </div>
      )}

      {step === 'pay' && (
        <div className="flex min-h-0 flex-1 flex-col px-3">
          <div className="min-h-0 flex-1 overflow-y-auto pb-3">
            <PublishCheckoutPanel
              draft={draft}
              onChange={setDraft}
              onPublishFree={() => publish('free')}
              onPublishPaid={() => publish('paid')}
              publishing={publishing}
              publishedOrderId={publishedOrderId}
              publishedAdisoId={publishedAdisoId}
              publisher={publisher}
            />
          </div>
          {!publishedOrderId && (
            <div className="shrink-0 border-t border-[var(--border-color)] pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => setStep('compose')} className={publishSecondaryBtn}>
                ← Volver
              </button>
            </div>
          )}
        </div>
      )}

      {confirmLeave && (
        <div className="fixed inset-0 z-[2200] flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div className={`${publishCard} w-full max-w-sm space-y-3 p-4`} role="dialog" aria-labelledby="leave-publish-title">
            <h2 id="leave-publish-title" className="m-0 text-base font-bold text-[var(--text-primary)]">
              Tienes un avance sin publicar
            </h2>
            <p className="m-0 text-sm leading-snug text-[var(--text-secondary)]">
              Puedes guardarlo como borrador y retomarlo cuando vuelvas, o descartarlo y borrar lo que llevas.
            </p>
            <button
              type="button"
              className={publishPrimaryBtn}
              onClick={() => onClose?.()}
            >
              Guardar borrador
            </button>
            <button
              type="button"
              className="w-full rounded-xl py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-500/10"
              onClick={() => {
                resetDraft();
                onClose?.();
              }}
            >
              Descartar avance
            </button>
            <button
              type="button"
              className="w-full py-2 text-sm font-semibold text-[var(--text-secondary)]"
              onClick={() => setConfirmLeave(false)}
            >
              Seguir editando
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
