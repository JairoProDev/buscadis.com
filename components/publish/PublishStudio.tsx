'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { usePublishDraft } from '@/hooks/usePublishDraft';
import { usePublishActions } from '@/hooks/usePublishActions';
import PublishPhotoZone from './PublishPhotoZone';
import PublishFormCompact from './PublishFormCompact';
import PublishPreviewCard from './PublishPreviewCard';
import PublishReachLines from './PublishReachLines';
import PublishCheckoutPanel from './PublishCheckoutPanel';
import PublishFixedChatBar from './PublishFixedChatBar';
import PublishStepIndicator from './PublishStepIndicator';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { hasMinimumContent } from '@/lib/publish/publish-draft-types';

type StudioStep = 'create' | 'pay';

interface PublishStudioProps {
  initialText?: string;
  initialImageUrl?: string | null;
  initialContacto?: string;
  compact?: boolean;
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  onPublished?: () => void;
  onClose?: () => void;
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
  const [step, setStep] = useState<StudioStep>('create');
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [enhancingField, setEnhancingField] = useState<'titulo' | 'descripcion' | null>(null);
  const [publishedOrderId, setPublishedOrderId] = useState<string | null>(null);
  const [publishedAdisoId, setPublishedAdisoId] = useState<string | null>(null);

  const handleChatSend = useCallback(async (text: string, imageUrl?: string) => {
    if (imageUrl) addImage(imageUrl);
    if (!text.trim() && !imageUrl) return;

    addChatMessage('user', text.trim() || '(imagen adjunta)');
    setAnalyzing(true);
    try {
      const res = await fetch('/api/publish/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          text: text.trim() || undefined,
          imageUrls: imageUrl
            ? [imageUrl, ...draft.imagenes]
            : draft.imagenes.length > 0
              ? draft.imagenes
              : undefined,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        mergeDraft(data.draft, data.confidence);
        addChatMessage('assistant', 'Listo, actualicé tu aviso con lo que compartiste.');
        onNotify?.('Aviso actualizado', 'success');
      }
    } catch {
      onNotify?.('No se pudo procesar', 'error');
    } finally {
      setAnalyzing(false);
    }
  }, [draft.imagenes, mergeDraft, addImage, addChatMessage, onNotify, session?.access_token]);

  const handleEnhanceImage = useCallback(async (url: string, action: string) => {
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
  }, [addImage, removeImage, onNotify]);

  const handleEnhanceField = useCallback(async (field: 'titulo' | 'descripcion') => {
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
  }, [draft.titulo, draft.descripcion, setDraft, onNotify]);

  const publish = useCallback(async (plan: 'free' | 'paid') => {
    if (!user?.id) {
      openAuthModal();
      return;
    }
    if (!hasMinimumContent(draft)) {
      onNotify?.('Agrega título, descripción o al menos una imagen', 'error');
      return;
    }

    const publishDraft: PublishDraft = plan === 'free'
      ? { ...draft, imagenes: draft.imagenes.slice(0, 1) }
      : draft;

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

      if (plan === 'paid') {
        setPublishedAdisoId(data.adiso?.id);
        setPublishedOrderId(data.orderId);
        onNotify?.('¡Publicado! Verifica tu pago Yape.', 'success');
      } else {
        onNotify?.('¡Publicado gratis por 24h!', 'success');
        resetDraft();
        setStep('create');
        onPublished?.();
      }
    } catch (e) {
      onNotify?.(e instanceof Error ? e.message : 'Error al publicar', 'error');
    } finally {
      setPublishing(false);
    }
  }, [user?.id, draft, session?.access_token, openAuthModal, onNotify, resetDraft, onPublished]);

  const goToPay = () => {
    if (!hasMinimumContent(draft)) {
      onNotify?.('Agrega título, descripción o al menos una imagen', 'error');
      return;
    }
    setStep('pay');
  };

  const chatPadding = step === 'create' && !publishedOrderId && !compact ? 'pb-[88px]' : '';

  return (
    <div className={`flex flex-col ${compact ? 'h-full min-h-0 relative' : 'min-h-0'} ${chatPadding}`}>
      {onClose && (
        <div className="flex items-center justify-between shrink-0 mb-2">
          <h2 className="text-base font-bold m-0">Publicar aviso</h2>
          <button type="button" onClick={onClose} className="p-2 text-[var(--text-tertiary)]" aria-label="Cerrar">✕</button>
        </div>
      )}

      <PublishStepIndicator
        step={step === 'create' ? 1 : 2}
        total={2}
        labels={['Tu aviso', 'Publicar']}
      />

      {step === 'create' && (
        <div className={`flex flex-col flex-1 min-h-0 ${compact ? '' : ''}`}>
          <div className="shrink-0 mb-2">
            <div className="flex flex-row items-start gap-3">
              <div className="shrink-0 max-h-[34vh] sm:max-h-[38vh] overflow-hidden">
                <PublishPreviewCard draft={draft} variant="live" compact />
              </div>
              <div className="flex-1 min-w-0 pt-1 flex items-center min-h-[80px]">
                <PublishReachLines draft={draft} />
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pb-1">
            <PublishPhotoZone
              images={draft.imagenes}
              onAdd={addImage}
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
            />

            {!compact && (
              <button
                type="button"
                onClick={goToPay}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ background: 'var(--brand-blue)' }}
              >
                Continuar
              </button>
            )}
          </div>

          {compact && (
            <button
              type="button"
              onClick={goToPay}
              className="shrink-0 w-full py-2.5 rounded-xl font-bold text-white text-sm mb-1"
              style={{ background: 'var(--brand-blue)' }}
            >
              Continuar
            </button>
          )}

          <PublishFixedChatBar
            onSend={handleChatSend}
            onUploadImage={uploadPublishImage}
            sending={analyzing}
            embedded={compact}
          />
        </div>
      )}

      {step === 'pay' && (
        <div className="flex-1 min-h-0 overflow-y-auto pb-4">
          <PublishCheckoutPanel
            draft={draft}
            onChange={setDraft}
            onPublishFree={() => publish('free')}
            onPublishPaid={() => publish('paid')}
            publishing={publishing}
            publishedOrderId={publishedOrderId}
            publishedAdisoId={publishedAdisoId}
            onBack={() => setStep('create')}
          />
        </div>
      )}
    </div>
  );
}
