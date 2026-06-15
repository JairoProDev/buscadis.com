'use client';

import { useEffect, useRef, useState } from 'react';
import Buscador, { ComposerMode } from './Buscador';
import PublishTierModal from './publish/PublishTierModal';
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

interface UnifiedSearchComposerProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  onCategoryDetected?: (categoria: Categoria) => void;
  onNotify?: (message: string, type?: 'info' | 'error' | 'success') => void;
  showFilterToggle?: boolean;
  filtersVisible?: boolean;
  onToggleFilters?: () => void;
  activeFiltersCount?: number;
  initialMode?: ComposerMode;
}

export default function UnifiedSearchComposer({
  value,
  onChange,
  compact = false,
  onCategoryDetected,
  onNotify,
  showFilterToggle,
  filtersVisible,
  onToggleFilters,
  activeFiltersCount,
  initialMode = 'search',
}: UnifiedSearchComposerProps) {
  const { user, profile, session } = useAuth();
  const { openAuthModal } = useUI();
  const [composerMode, setComposerMode] = useState<ComposerMode>(initialMode);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingTier, setLoadingTier] = useState<'free' | 'pro' | null>(null);
  const [publishImageUrl, setPublishImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const detectedPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (profile?.telefono) {
      detectedPhoneRef.current = extractPrimaryPhone('', profile.telefono);
    }
  }, [profile?.telefono]);

  const handleComposerChange = (next: string) => {
    if (composerMode !== 'publish') {
      onChange(next);
      return;
    }

    const matches = findPhoneMatches(next);
    if (matches.length > 0) {
      detectedPhoneRef.current = matches[matches.length - 1].normalized;
    } else if (!next.includes(PHONE_MASK)) {
      detectedPhoneRef.current = profile?.telefono
        ? extractPrimaryPhone('', profile.telefono)
        : null;
    }

    onChange(maskPhonesInText(next));
  };

  const resolveContacto = () =>
    detectedPhoneRef.current || extractPrimaryPhone(value, profile?.telefono);

  const publishText = removePhonesFromText(value).trim();
  const hasText = publishText.length > 0;
  const searchHasText = value.trim().length > 0;

  const handlePublishImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onNotify?.('Selecciona una imagen (JPG, PNG, WebP).', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      onNotify?.('La imagen es muy grande. Máximo 8 MB.', 'error');
      return;
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
    } catch (e) {
      onNotify?.(e instanceof Error ? e.message : 'No se pudo subir la foto', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePublishFree = async () => {
    if (!user?.id) {
      onNotify?.('Inicia sesión para publicar.', 'info');
      openAuthModal();
      return;
    }

    const contacto = resolveContacto();
    if (!contacto) {
      onNotify?.('Incluye tu WhatsApp en el texto o configúralo en tu perfil.', 'error');
      return;
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
          text: publishText,
          contacto,
          imageUrl: publishImageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      onNotify?.('¡Anuncio publicado gratis por 24h!', 'success');
      onChange('');
      setPublishImageUrl(null);
      setTierModalOpen(false);
      detectedPhoneRef.current = profile?.telefono
        ? extractPrimaryPhone('', profile.telefono)
        : null;
    } catch (e) {
      onNotify?.(e instanceof Error ? e.message : 'No se pudo publicar', 'error');
    } finally {
      setPublishing(false);
      setLoadingTier(null);
    }
  };

  const handlePublishPro = async () => {
    if (!user?.id) {
      openAuthModal();
      return;
    }

    setLoadingTier('pro');
    try {
      const res = await fetch('/api/ai/quick-compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: publishText }),
      });
      const data = await res.json();
      setTierModalOpen(false);

      if (data.draft) {
        onCategoryDetected?.(data.draft.categoria);
        const params = new URLSearchParams({
          titulo: data.draft.titulo,
          descripcion: data.draft.descripcion,
          categoria: data.draft.categoria,
        });
        if (publishImageUrl) params.set('imagen', publishImageUrl);
        window.location.href = `/publicar?${params.toString()}`;
        return;
      }

      window.location.href = `/publicar?descripcion=${encodeURIComponent(publishText)}`;
    } catch {
      onNotify?.('No se pudo preparar el anuncio con IA.', 'error');
    } finally {
      setLoadingTier(null);
    }
  };

  const handlePrimaryAction = () => {
    if (composerMode === 'publish') {
      if (!hasText) {
        onNotify?.('Escribe tu anuncio primero.', 'info');
        return;
      }
      setTierModalOpen(true);
      return;
    }

    if (!searchHasText) {
      onNotify?.('Escribe qué buscas', 'info');
      return;
    }
    onNotify?.(`Buscando: "${value.trim()}"`, 'success');
  };

  const primaryDisabled =
    composerMode === 'publish'
      ? !hasText || publishing || uploadingImage
      : !searchHasText;

  return (
    <div>
      <Buscador
        value={value}
        onChange={handleComposerChange}
        compact={compact}
        composerMode={composerMode}
        onComposerModeChange={(mode) => {
          setComposerMode(mode);
          if (mode === 'search') {
            setPublishImageUrl(null);
          }
        }}
        onCategoryDetected={onCategoryDetected}
        onNotify={onNotify}
        showFilterToggle={showFilterToggle && composerMode === 'search'}
        filtersVisible={filtersVisible}
        onToggleFilters={onToggleFilters}
        activeFiltersCount={activeFiltersCount}
        onPrimaryAction={handlePrimaryAction}
        primaryActionDisabled={primaryDisabled}
        primaryActionLoading={publishing}
        primaryActionLabel={
          composerMode === 'publish'
            ? publishing
              ? 'Publicando…'
              : 'Publicar'
            : 'Buscar'
        }
        onPublishImageSelected={composerMode === 'publish' ? handlePublishImage : undefined}
        publishImageAttached={Boolean(publishImageUrl)}
        publishImageUploading={uploadingImage}
      />

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
