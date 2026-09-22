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
import PublishPhotoZone from './PublishPhotoZone';
import PublishFormCompact from './PublishFormCompact';
import PublishReviewStep from './PublishReviewStep';
import PublishCheckoutPanel from './PublishCheckoutPanel';
import PublishFixedChatBar from './PublishFixedChatBar';
import PublishStepIndicator from './PublishStepIndicator';
import PublishAIQuestions from './PublishAIQuestions';
import PublishModeSwitcher, { type PublishStudioMode } from './PublishModeSwitcher';
import type { PublisherPreview } from './PublishPreviewCard';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { hasMinimumContent } from '@/lib/publish/publish-draft-types';
import { publishPrimaryBtn, publishSecondaryBtn, publishCard } from './publish-ui';
import { IconCamera, IconMicrophone } from '@/components/Icons';
import type { Adiso } from '@/types';
import { defaultFlyerForCategory } from '@/lib/flyer/templates';
import { exportAndUploadFlyer } from '@/lib/flyer/export-client';
import type { FlyerConfig, FlyerTemplateId } from '@/lib/flyer/types';
import FlyerCanvas from '@/components/flyer/FlyerCanvas';
import { buildFlyerContent } from '@/lib/flyer/layout';
import { resolveFlyerConfig } from '@/lib/flyer/templates';
import { downloadCoverImage } from '@/lib/publish/download-cover';
import FlyerTemplatePicker from '@/components/flyer/FlyerTemplatePicker';

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
    addChatMessage,
  } = usePublishDraft({
    descripcion: initialText,
    contacto: initialContacto,
    imagenes: initialImageUrl ? [initialImageUrl] : [],
  });

  const { uploadPublishImage, uploadingImage } = usePublishActions(onNotify);
  const [step, setStepState] = useState<StudioStep>(() => loadStudioStep());
  const [mode, setMode] = useState<PublishStudioMode>('capture');
  const [analyzing, setAnalyzing] = useState(false);
  const [chatStatus, setChatStatus] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [enhancingField, setEnhancingField] = useState<'titulo' | 'descripcion' | null>(null);
  const [publishedOrderId, setPublishedOrderId] = useState<string | null>(null);
  const [publishedAdisoId, setPublishedAdisoId] = useState<string | null>(null);
  const [publisher, setPublisher] = useState<PublisherPreview | null>(null);
  const [autoDownload, setAutoDownload] = useState(true);
  const [showUpsell, setShowUpsell] = useState(false);
  const flyerExportRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { isListening, isSupported, start: startVoice, stop: stopVoice } = useSpeechRecognition('es-PE');

  useEffect(() => {
    if (draft.flyerTemplateId) return;
    const d = defaultFlyerForCategory(draft.categoria);
    setDraft({ flyerTemplateId: d.templateId, flyerConfig: d.config });
  }, [draft.categoria, draft.flyerTemplateId, setDraft]);

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

  const handleEnhanceImage = useCallback(
    async (url: string, action: string) => {
      try {
        const res = await fetch('/api/catalog/enhance-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, imageUrl: url }),
        });
        const data = await res.json();
        if (data.url) {
          removeImage(url);
          addImage(data.url);
          onNotify?.('Imagen mejorada', 'success');
        }
      } catch {
        onNotify?.('No se pudo mejorar la imagen', 'error');
      }
    },
    [addImage, removeImage, onNotify]
  );

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
  const showChat = !immersive || mode === 'form';

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
      className={`flex flex-col ${
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

      {onClose && (
        <div className="mb-2 flex shrink-0 items-center justify-between px-1">
          <h2 className="m-0 text-base font-bold text-[var(--text-primary)]">Publicar aviso</h2>
          <button
            type="button"
            onClick={onClose}
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
          <PublishModeSwitcher mode={mode} onChange={setMode} />

          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {(mode === 'capture' || mode === 'template' || mode === 'design') && (
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

                {mode === 'capture' && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={uploadingImage || analyzing}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
                      aria-label="Galería"
                      title="Galería"
                    >
                      <IconCamera size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploadingImage || analyzing}
                      className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[var(--brand-blue)] text-white shadow-lg"
                      aria-label="Tomar foto"
                      title="Tomar foto"
                    >
                      <IconCamera size={28} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleVoiceCapture()}
                      disabled={analyzing}
                      className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur ${
                        isListening || recordingAudio
                          ? 'animate-pulse bg-red-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                      aria-label={
                        isListening || recordingAudio ? 'Detener dictado' : 'Dictar aviso'
                      }
                      aria-pressed={isListening || recordingAudio}
                      title={isListening || recordingAudio ? 'Detener' : 'Dictar'}
                    >
                      <IconMicrophone size={22} />
                    </button>
                  </div>
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

            {mode === 'capture' && draft.missingFields.length > 0 && (
              <div className="mb-3">
                <PublishAIQuestions draft={draft} onAnswer={handleAiAnswer} />
              </div>
            )}

            {mode === 'capture' && (draft.titulo || draft.descripcion) && (
              <div className={`${publishCard} mb-3 space-y-1 p-3`}>
                {draft.titulo && (
                  <p className="m-0 text-sm font-bold text-[var(--text-primary)] line-clamp-2">{draft.titulo}</p>
                )}
                {draft.descripcion && (
                  <p className="m-0 text-xs text-[var(--text-secondary)] line-clamp-3">{draft.descripcion}</p>
                )}
              </div>
            )}

            {mode === 'form' && (
              <div className="space-y-4">
                <PublishPhotoZone
                  images={draft.imagenes}
                  onAdd={handlePhotoAdded}
                  onRemove={removeImage}
                  onUpload={uploadPublishImage}
                  onEnhance={handleEnhanceImage}
                  uploading={uploadingImage}
                  maxImages={10}
                  allowEnhance
                  flyerEnabled={false}
                  draftPreview={{
                    titulo: draft.titulo,
                    precio: draft.precio,
                    moneda: draft.moneda,
                    tipoPrecio: draft.tipoPrecio,
                    ubicacion: draft.ubicacion,
                    categoria: draft.categoria,
                  }}
                />
                <PublishFormCompact
                  draft={draft}
                  onChange={setDraft}
                  onSetAtributo={setAtributo}
                  showAdvanced={showAdvanced}
                  onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
                  onEnhanceField={handleEnhanceField}
                  enhancingField={enhancingField}
                  analyzing={analyzing}
                />
                {draft.missingFields.length > 0 && (
                  <PublishAIQuestions draft={draft} onAnswer={handleAiAnswer} />
                )}
              </div>
            )}

            {(mode === 'template' || mode === 'design') && (
              <FlyerTemplatePicker
                templateId={exportTemplateId}
                config={exportConfig}
                content={exportContent}
                onChange={(next) =>
                  setDraft({ flyerTemplateId: next.templateId, flyerConfig: next.config })
                }
                compact={mode === 'template'}
              />
            )}

            {mode === 'form' && (
              <PublishFixedChatBar
                onSend={handleChatSend}
                onUploadImage={uploadPublishImage}
                sending={analyzing}
                embedded
                statusMessage={chatStatus}
              />
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={autoDownload}
                onChange={(e) => setAutoDownload(e.target.checked)}
                className="rounded border-[var(--border-color)]"
              />
              Descargar portada al publicar
            </label>
            <button
              type="button"
              onClick={() => void publish('free')}
              className={publishPrimaryBtn}
              disabled={!canPublish}
            >
              {publishing ? 'Publicando…' : 'Publicar gratis'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!hasMinimumContent(draft)) {
                  onNotify?.('Agrega título, descripción o al menos una imagen', 'error');
                  return;
                }
                setStep('review');
              }}
              className={publishSecondaryBtn}
              disabled={analyzing}
            >
              Revisar o destacar
            </button>
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
    </div>
  );
}
