'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
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
import type { PublisherPreview } from './PublishPreviewCard';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { hasMinimumContent } from '@/lib/publish/publish-draft-types';
import { publishPrimaryBtn, publishSecondaryBtn, publishCard } from './publish-ui';
import { IconAdis } from '@/components/Icons';
import type { Adiso } from '@/types';

export const STORIES_REFRESH_EVENT = 'buscadis:stories-refresh';

interface PublishStudioProps {
  initialText?: string;
  initialImageUrl?: string | null;
  initialContacto?: string;
  compact?: boolean;
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
  const [analyzing, setAnalyzing] = useState(false);
  const [chatStatus, setChatStatus] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [enhancingField, setEnhancingField] = useState<'titulo' | 'descripcion' | null>(null);
  const [publishedOrderId, setPublishedOrderId] = useState<string | null>(null);
  const [publishedAdisoId, setPublishedAdisoId] = useState<string | null>(null);
  const [publisher, setPublisher] = useState<PublisherPreview | null>(null);

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
    async (opts: { text?: string; imageUrl?: string; source: 'chat' | 'photo' }) => {
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
              ? 'Listo: extraje datos de tu foto y rellené el formulario.'
              : 'Listo, actualicé tu aviso con lo que compartiste.';
          addChatMessage('assistant', msg);
          setChatStatus(msg);
          onNotify?.('Aviso actualizado por ADIS', 'success');
          return true;
        }

        const emptyMsg =
          'No pude extraer suficiente info. Escribe un título o describe el aviso en el chat.';
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
    [draft.imagenes, mergeDraft, addChatMessage, onNotify, session?.access_token]
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
      if (!draft.titulo?.trim()) {
        void runAnalyze({ imageUrl: url, source: 'photo' });
      }
    },
    [addImage, draft.titulo, runAnalyze]
  );

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
        const res = await fetch('/api/adisos/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            ...publishDraft,
            imagenes: publishDraft.imagenes,
            plan,
            paidDays: publishDraft.paidDays ?? 7,
            dailyRate: publishDraft.dailyRate ?? 5,
          }),
        });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar');

      const created = data.adiso as Adiso | undefined;
      if (created) {
        // Enriquecer con logo/nombre del negocio para que el card del feed se vea completo
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

      if (plan === 'paid') {
        setPublishedAdisoId(data.adiso?.id);
        setPublishedOrderId(data.orderId);
        onNotify?.('¡Ya está en el feed! Verifica tu pago Yape para activar el contacto.', 'success');
      } else {
        onNotify?.('¡Publicado! Ya aparece arriba en el feed (gratis 24h).', 'success');
        resetDraft();
        setStep('compose');
      }
      } catch (e) {
        onNotify?.(e instanceof Error ? e.message : 'Error al publicar', 'error');
      } finally {
        setPublishing(false);
      }
    },
    [user?.id, draft, session?.access_token, openAuthModal, onNotify, resetDraft, onPublished, setStep, publisher]
  );

  const goToReview = () => {
    if (!hasMinimumContent(draft)) {
      onNotify?.('Agrega título, descripción o al menos una imagen', 'error');
      return;
    }
    setStep('review');
  };

  const stepNumber = step === 'compose' ? 1 : step === 'review' ? 2 : 3;
  const chatPadding = step === 'compose' && !publishedOrderId && !compact ? 'pb-[120px]' : '';

  return (
    <div className={`flex flex-col ${compact ? 'h-full min-h-0 relative' : 'min-h-0'} ${chatPadding}`}>
      {onClose && (
        <div className="flex items-center justify-between shrink-0 mb-2 px-1">
          <h2 className="text-base font-bold m-0 text-[var(--text-primary)]">Publicar aviso</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--hover-bg)] transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}

      <PublishStepIndicator step={stepNumber} />

      {step === 'compose' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className={`${publishCard} p-3.5 mb-3 flex items-center gap-3 shrink-0 mx-0`}>
            <div className="w-9 h-9 rounded-full bg-[rgba(var(--brand-primary-rgb),0.12)] ring-1 ring-[rgba(var(--brand-primary-rgb),0.2)] flex items-center justify-center shrink-0">
              <IconAdis size={18} color="var(--brand-blue)" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] m-0">Crea tu aviso</p>
              <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5 leading-snug">
                Sube una foto o escribe abajo: ADIS rellena título y descripción.
              </p>
            </div>
          </div>

          <div className={`${publishCard} flex-1 min-h-0 overflow-y-auto p-4 space-y-4`}>
            <PublishPhotoZone
              images={draft.imagenes}
              onAdd={handlePhotoAdded}
              onRemove={removeImage}
              onUpload={uploadPublishImage}
              onEnhance={handleEnhanceImage}
              uploading={uploadingImage}
              maxImages={10}
              allowEnhance
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
          </div>

          <div className={`shrink-0 pt-3 ${compact ? 'mb-0' : ''}`}>
            <button type="button" onClick={goToReview} className={publishPrimaryBtn} disabled={analyzing}>
              Revisar aviso
            </button>
          </div>

          <PublishFixedChatBar
            onSend={handleChatSend}
            onUploadImage={uploadPublishImage}
            sending={analyzing}
            embedded={compact}
            statusMessage={chatStatus}
          />
        </div>
      )}

      {step === 'review' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto pb-3">
            <PublishReviewStep draft={draft} publisher={publisher} />
          </div>
          <div className="shrink-0 space-y-2 pt-2 border-t border-[var(--border-color)]">
            <button type="button" onClick={() => setStep('pay')} className={publishPrimaryBtn}>
              Elegir plan y publicar
            </button>
            <button type="button" onClick={() => setStep('compose')} className={publishSecondaryBtn}>
              ← Volver a editar
            </button>
          </div>
        </div>
      )}

      {step === 'pay' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto pb-3">
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
            <div className="shrink-0 pt-2 border-t border-[var(--border-color)]">
              <button type="button" onClick={() => setStep('review')} className={publishSecondaryBtn}>
                ← Volver a revisar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
