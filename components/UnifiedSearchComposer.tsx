'use client';

import { useState } from 'react';
import Buscador, { ComposerMode } from './Buscador';
import PublishTierModal from './publish/PublishTierModal';
import PublishImagePreview from './publish/PublishImagePreview';
import { usePublishActions } from '@/hooks/usePublishActions';
import { Categoria } from '@/types';
import { maskPhonesInText, removePhonesFromText } from '@/lib/phone';

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
  /** modal = tier modal on publish; chat = feed into PublishChatWizard */
  publishBehavior?: 'modal' | 'chat';
  onPublishToChat?: (payload: { text: string; imageUrl: string | null }) => void;
  /** Barra plana para panel lateral (sin borde animado ni forma de píldora) */
  flat?: boolean;
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
  publishBehavior = 'modal',
  onPublishToChat,
  flat = false,
}: UnifiedSearchComposerProps) {
  const [composerMode, setComposerMode] = useState<ComposerMode>(initialMode);
  const [tierModalOpen, setTierModalOpen] = useState(false);

  const {
    publishImageUrl,
    setPublishImageUrl,
    uploadingImage,
    publishing,
    loadingTier,
    syncPhoneFromText,
    uploadPublishImage,
    publishFree,
    publishProRedirect,
  } = usePublishActions(onNotify);

  const handleComposerChange = (next: string) => {
    if (composerMode !== 'publish') {
      onChange(next);
      return;
    }

    syncPhoneFromText(next);
    onChange(maskPhonesInText(next));
  };

  const publishText = removePhonesFromText(value).trim();
  const hasText = publishText.length > 0;
  const searchHasText = value.trim().length > 0;

  const handlePublishFree = async () => {
    const ok = await publishFree(publishText, undefined, undefined, publishImageUrl || undefined);
    if (ok) {
      onChange('');
      setPublishImageUrl(null);
      setTierModalOpen(false);
    }
  };

  const handlePublishPro = async () => {
    setTierModalOpen(false);
    await publishProRedirect(publishText, undefined, publishImageUrl || undefined);
  };

  const handlePrimaryAction = () => {
    if (composerMode === 'publish') {
      if (!hasText) {
        onNotify?.('Escribe tu anuncio primero.', 'info');
        return;
      }
      if (publishBehavior === 'chat') {
        onPublishToChat?.({ text: publishText, imageUrl: publishImageUrl });
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
        flat={flat}
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
              : publishBehavior === 'chat'
                ? 'Continuar'
                : 'Publicar'
            : 'Buscar'
        }
        onPublishImageSelected={composerMode === 'publish' ? (f) => void uploadPublishImage(f) : undefined}
        publishImageAttached={Boolean(publishImageUrl)}
        publishImageUploading={uploadingImage}
      />

      {composerMode === 'publish' && publishImageUrl && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <PublishImagePreview url={publishImageUrl} onRemove={() => setPublishImageUrl(null)} size="sm" />
          <span className="text-xs text-[var(--text-tertiary)]">Vista previa · se incluirá al publicar</span>
        </div>
      )}

      {publishBehavior === 'modal' && (
        <PublishTierModal
          open={tierModalOpen}
          onClose={() => !publishing && setTierModalOpen(false)}
          onChooseFree={() => void handlePublishFree()}
          onChoosePro={() => void handlePublishPro()}
          loading={publishing || loadingTier !== null}
          loadingTier={loadingTier}
        />
      )}
    </div>
  );
}
