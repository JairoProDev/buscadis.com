'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { Categoria } from '@/types';
import {
  extractPrimaryPhone,
  findPhoneMatches,
  maskPhonesInText,
  PHONE_MASK,
  removePhonesFromText,
} from '@/lib/phone';

export function usePublishActions(onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void) {
  const { user, profile, session } = useAuth();
  const { openAuthModal } = useUI();
  const [publishImageUrl, setPublishImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingTier, setLoadingTier] = useState<'free' | 'pro' | null>(null);
  const detectedPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (profile?.telefono) {
      detectedPhoneRef.current = extractPrimaryPhone('', profile.telefono);
    }
  }, [profile?.telefono]);

  const syncPhoneFromText = (text: string) => {
    const matches = findPhoneMatches(text);
    if (matches.length > 0) {
      detectedPhoneRef.current = matches[matches.length - 1].normalized;
    }
  };

  const resolveContacto = (text: string, explicit?: string) =>
    explicit?.trim() ||
    detectedPhoneRef.current ||
    extractPrimaryPhone(text, profile?.telefono);

  const uploadPublishImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onNotify?.('Selecciona una imagen (JPG, PNG, WebP).', 'error');
      return null;
    }
    if (file.size > 8 * 1024 * 1024) {
      onNotify?.('La imagen es muy grande. Máximo 8 MB.', 'error');
      return null;
    }
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      setPublishImageUrl(data.url);
      onNotify?.('Foto adjunta', 'success');
      return data.url as string;
    } catch (e) {
      onNotify?.(e instanceof Error ? e.message : 'No se pudo subir la foto', 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  }, [onNotify]);

  const publishFree = useCallback(
    async (text: string, contacto?: string, categoria?: Categoria, imageUrl?: string) => {
      if (!user?.id) {
        onNotify?.('Inicia sesión para publicar.', 'info');
        openAuthModal();
        return false;
      }
      const clean = removePhonesFromText(text).trim();
      const phone = resolveContacto(text, contacto);
      if (!clean) {
        onNotify?.('Escribe tu anuncio primero.', 'error');
        return false;
      }
      if (!phone) {
        onNotify?.('Agrega tu WhatsApp.', 'error');
        return false;
      }

      setPublishing(true);
      setLoadingTier('free');
      try {
        const res = await fetch('/api/adisos/publish/free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            text: clean,
            contacto: phone,
            categoria,
            imageUrl: imageUrl || publishImageUrl || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error');
        onNotify?.('¡Anuncio publicado gratis por 24h!', 'success');
        setPublishImageUrl(null);
        return true;
      } catch (e) {
        onNotify?.(e instanceof Error ? e.message : 'No se pudo publicar', 'error');
        return false;
      } finally {
        setPublishing(false);
        setLoadingTier(null);
      }
    },
    [user?.id, session?.access_token, publishImageUrl, onNotify, openAuthModal, profile?.telefono],
  );

  const publishProRedirect = useCallback(
    async (text: string, draft?: { titulo: string; descripcion: string; categoria: Categoria }, imageUrl?: string) => {
      if (!user?.id) {
        openAuthModal();
        return;
      }
      setLoadingTier('pro');
      try {
        if (draft) {
          const params = new URLSearchParams({
            titulo: draft.titulo,
            descripcion: draft.descripcion,
            categoria: draft.categoria,
          });
          const img = imageUrl || publishImageUrl;
          if (img) params.set('imagen', img);
          window.location.href = `/publicar?${params.toString()}&tier=pro`;
          return;
        }
        const res = await fetch('/api/ai/quick-compose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: removePhonesFromText(text).trim() }),
        });
        const data = await res.json();
        if (data.draft) {
          const params = new URLSearchParams({
            titulo: data.draft.titulo,
            descripcion: data.draft.descripcion,
            categoria: data.draft.categoria,
            tier: 'pro',
          });
          const img = imageUrl || publishImageUrl;
          if (img) params.set('imagen', img);
          window.location.href = `/publicar?${params.toString()}`;
          return;
        }
        window.location.href = `/publicar?descripcion=${encodeURIComponent(text)}&tier=pro`;
      } catch {
        onNotify?.('No se pudo preparar el anuncio con IA.', 'error');
      } finally {
        setLoadingTier(null);
      }
    },
    [user?.id, publishImageUrl, onNotify, openAuthModal],
  );

  return {
    publishImageUrl,
    setPublishImageUrl,
    uploadingImage,
    publishing,
    loadingTier,
    syncPhoneFromText,
    maskPublishText: maskPhonesInText,
    uploadPublishImage,
    publishFree,
    publishProRedirect,
    resolveContacto,
  };
}
