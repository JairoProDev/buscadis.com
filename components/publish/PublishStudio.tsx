'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { usePublishDraft } from '@/hooks/usePublishDraft';
import { usePublishActions } from '@/hooks/usePublishActions';
import PublishPhotoZone from './PublishPhotoZone';
import PublishMagicInput from './PublishMagicInput';
import PublishFormCompact from './PublishFormCompact';
import PublishFormAdvanced from './PublishFormAdvanced';
import PublishAIQuestions from './PublishAIQuestions';
import PublishPreviewCarousel from './PublishPreviewCarousel';
import PublishAudienceFunnel from './PublishAudienceFunnel';
import PublishCheckoutPanel from './PublishCheckoutPanel';
import PublishMagicEditorPanel from './PublishMagicEditorPanel';
import { PublishDraft } from '@/lib/publish/publish-draft-types';
import { hasMinimumContent } from '@/lib/publish/publish-draft-types';

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
    simpleMode,
    setSimpleMode,
    showAdvanced,
    setShowAdvanced,
    resetDraft,
  } = usePublishDraft({
    descripcion: initialText,
    contacto: initialContacto,
    imagenes: initialImageUrl ? [initialImageUrl] : [],
  });

  const { uploadPublishImage, uploadingImage } = usePublishActions(onNotify);
  const [magicText, setMagicText] = useState(initialText);
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedOrderId, setPublishedOrderId] = useState<string | null>(null);
  const [publishedAdisoId, setPublishedAdisoId] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!magicText.trim() && draft.imagenes.length === 0) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/publish/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          text: magicText.trim() || undefined,
          imageUrls: draft.imagenes.length > 0 ? draft.imagenes : undefined,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        mergeDraft(data.draft, data.confidence);
        onNotify?.('Formulario autorellenado', 'success');
      }
    } catch {
      onNotify?.('No se pudo analizar', 'error');
    } finally {
      setAnalyzing(false);
    }
  }, [magicText, draft.imagenes, mergeDraft, onNotify, session?.access_token]);

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

  const handleAIAnswer = useCallback((fieldId: string, value: string | number | boolean) => {
    if (fieldId === 'categoria') setDraft({ categoria: value as PublishDraft['categoria'] });
    else if (fieldId === 'titulo') setDraft({ titulo: String(value) });
    else if (fieldId === 'descripcion') setDraft({ descripcion: String(value) });
    else if (fieldId === 'contacto') setDraft({ contacto: String(value) });
    else if (fieldId === 'precio') setDraft({ precio: Number(value), tipoPrecio: 'fijo' });
    else if (fieldId === 'ubicacion') setDraft({ ubicacion: String(value) });
    else if (fieldId === 'subcategoria') setDraft({ subcategoria: String(value) });
    else setAtributo(fieldId, value);
  }, [setDraft, setAtributo]);

  const publish = useCallback(async (plan: 'free' | 'paid') => {
    if (!user?.id) {
      openAuthModal();
      return;
    }
    if (!hasMinimumContent(draft)) {
      onNotify?.('Agrega título, descripción o al menos una imagen', 'error');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/adisos/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          ...draft,
          imagenes: draft.imagenes,
          plan,
          paidDays: draft.paidDays ?? 7,
          dailyRate: draft.dailyRate ?? 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar');

      if (plan === 'paid') {
        setPublishedAdisoId(data.adiso?.id);
        setPublishedOrderId(data.orderId);
        onNotify?.('¡Aviso publicado! Verifica tu pago Yape para activar contacto.', 'success');
      } else {
        onNotify?.('¡Publicado gratis por 24h!', 'success');
        resetDraft();
        onPublished?.();
      }
    } catch (e) {
      onNotify?.(e instanceof Error ? e.message : 'Error al publicar', 'error');
    } finally {
      setPublishing(false);
    }
  }, [user?.id, draft, session?.access_token, openAuthModal, onNotify, resetDraft, onPublished]);

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'min-h-0'} gap-4`}>
      {onClose && (
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold m-0">Publicar aviso</h2>
          <button type="button" onClick={onClose} className="p-2 text-[var(--text-tertiary)]" aria-label="Cerrar">✕</button>
        </div>
      )}

      <div className={`flex-1 min-h-0 overflow-y-auto ${compact ? '' : ''}`}>
        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
          {/* Left column: input + form */}
          <div className="space-y-4">
            <PublishPhotoZone
              images={draft.imagenes}
              onAdd={addImage}
              onRemove={removeImage}
              onUpload={uploadPublishImage}
              onEnhance={handleEnhanceImage}
              uploading={uploadingImage}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSimpleMode(!simpleMode)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                  simpleMode ? 'bg-[var(--brand-blue)] text-white border-[var(--brand-blue)]' : 'border-[var(--border-color)]'
                }`}
              >
                Modo simple
              </button>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                  showAdvanced ? 'bg-[var(--brand-blue)] text-white border-[var(--brand-blue)]' : 'border-[var(--border-color)]'
                }`}
              >
                {showAdvanced ? 'Menos opciones' : 'Más opciones'}
              </button>
            </div>

            {!simpleMode && (
              <>
                <PublishMagicEditorPanel
                  draft={draft}
                  onFillAll={(data) => mergeDraft(data)}
                  onEnhanceField={(field, value) => setDraft({ [field]: value })}
                />
                <PublishMagicInput
                  value={magicText}
                  onChange={setMagicText}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzing}
                />
                <PublishAIQuestions draft={draft} onAnswer={handleAIAnswer} />
              </>
            )}

            <div className="rounded-2xl border border-[var(--border-color)] p-4 bg-[var(--bg-primary)]">
              <PublishFormCompact draft={draft} onChange={setDraft} />
              {showAdvanced && (
                <PublishFormAdvanced draft={draft} onSetAtributo={setAtributo} onChange={setDraft} />
              )}
            </div>
          </div>

          {/* Right column: preview + funnel + checkout */}
          <div className="space-y-4">
            <PublishPreviewCarousel draft={draft} />
            <PublishAudienceFunnel draft={draft} />
            <PublishCheckoutPanel
              draft={draft}
              onChange={setDraft}
              onPublishFree={() => publish('free')}
              onPublishPaid={() => publish('paid')}
              publishing={publishing}
              publishedOrderId={publishedOrderId}
              publishedAdisoId={publishedAdisoId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
