'use client';

import { useState, useCallback, useMemo, useRef, type KeyboardEvent } from 'react';
import Buscador, { ComposerMode } from '@/components/Buscador';
import PublishTierModal from '@/components/publish/PublishTierModal';
import PublishImagePreview from '@/components/publish/PublishImagePreview';
import { usePublishActions } from '@/hooks/usePublishActions';
import { Categoria } from '@/types';
import { maskPhonesInText, removePhonesFromText } from '@/lib/phone';
import SearchSuggestionsDropdown from './SearchSuggestionsDropdown';
import { useSearchSuggestions } from './useSearchSuggestions';
import type { SuggestAdiso } from './useSearchSuggestions';
import { trackSearchEvent } from '@/lib/search/analytics';

interface MarketplaceSearchComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSearchSubmit: (query: string) => void | Promise<void>;
  onOpenAdiso?: (adisoId: string) => void;
  searchLoading?: boolean;
  compact?: boolean;
  onCategoryDetected?: (categoria: Categoria) => void;
  onNotify?: (message: string, type?: 'info' | 'error' | 'success') => void;
  showFilterToggle?: boolean;
  filtersVisible?: boolean;
  onToggleFilters?: () => void;
  activeFiltersCount?: number;
  initialMode?: ComposerMode;
  publishBehavior?: 'modal' | 'chat';
  onPublishToChat?: (payload: { text: string; imageUrl: string | null }) => void;
}

export default function MarketplaceSearchComposer({
  value,
  onChange,
  onSearchSubmit,
  onOpenAdiso,
  searchLoading = false,
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
}: MarketplaceSearchComposerProps) {
  const [composerMode, setComposerMode] = useState<ComposerMode>(initialMode);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [toggleExpanded, setToggleExpanded] = useState(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isSearchMode = composerMode === 'search';
  const isTyping = value.trim().length >= 2;
  const collapseToggle = isTyping && !toggleExpanded;

  const suggestions = useSearchSuggestions(value, isSearchMode);

  const suggestItems = useMemo(() => {
    const items: Array<{ type: 'adiso'; adiso: SuggestAdiso } | { type: 'query'; query: string }> = [];
    for (const a of suggestions.adisos) items.push({ type: 'adiso', adiso: a });
    for (const q of suggestions.queries) items.push({ type: 'query', query: q });
    return items;
  }, [suggestions.adisos, suggestions.queries]);

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
    setActiveSuggestIndex(-1);
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

  const handleSearchSubmit = useCallback(async () => {
    const q = value.trim();
    if (!q) {
      onNotify?.('Escribe qué buscas', 'info');
      return;
    }
    await onSearchSubmit(q);
    trackSearchEvent('search.submit', { query: q });
  }, [value, onSearchSubmit, onNotify]);

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
    void handleSearchSubmit();
  };

  const selectSuggestion = (index: number) => {
    const item = suggestItems[index];
    if (!item) return;
    if (item.type === 'adiso') {
      if (onOpenAdiso) {
        onOpenAdiso(item.adiso.id);
      } else {
        onChange(item.adiso.titulo);
        void handleSearchSubmit();
      }
      setActiveSuggestIndex(-1);
      return;
    }
    onChange(item.query);
    setActiveSuggestIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isSearchMode || suggestItems.length === 0) {
      if (e.key === 'Tab' && suggestions.completion && isSearchMode) {
        e.preventDefault();
        onChange(value + suggestions.completion);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestIndex((i) => Math.min(i + 1, suggestItems.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter' && activeSuggestIndex >= 0) {
      e.preventDefault();
      selectSuggestion(activeSuggestIndex);
      return;
    }
    if (e.key === 'Tab' && suggestions.completion) {
      e.preventDefault();
      onChange(value + suggestions.completion);
      return;
    }
    if (e.key === 'Escape') {
      setActiveSuggestIndex(-1);
    }
  };

  const primaryDisabled =
    composerMode === 'publish'
      ? !hasText || publishing || uploadingImage
      : !searchHasText || searchLoading;

  return (
    <div ref={wrapperRef} className="relative" onKeyDown={handleKeyDown}>
      <div
        onMouseEnter={() => isTyping && setToggleExpanded(true)}
        onMouseLeave={() => setToggleExpanded(false)}
        onFocus={() => isTyping && setToggleExpanded(true)}
      >
        <Buscador
          value={value}
          onChange={handleComposerChange}
          compact={compact}
          composerMode={composerMode}
          onComposerModeChange={(mode) => {
            setComposerMode(mode);
            if (mode === 'search') setPublishImageUrl(null);
          }}
          onCategoryDetected={onCategoryDetected}
          onNotify={onNotify}
          showFilterToggle={showFilterToggle && composerMode === 'search'}
          filtersVisible={filtersVisible}
          onToggleFilters={onToggleFilters}
          activeFiltersCount={activeFiltersCount}
          onPrimaryAction={handlePrimaryAction}
          primaryActionDisabled={primaryDisabled}
          primaryActionLoading={publishing || searchLoading}
          primaryActionLabel={
            composerMode === 'publish'
              ? publishing
                ? 'Publicando…'
                : publishBehavior === 'chat'
                  ? 'Continuar'
                  : 'Publicar'
              : searchLoading
                ? 'Buscando…'
                : 'Buscar'
          }
          onPublishImageSelected={composerMode === 'publish' ? (f) => void uploadPublishImage(f) : undefined}
          publishImageAttached={Boolean(publishImageUrl)}
          publishImageUploading={uploadingImage}
          forceModeToggleIconsOnly={collapseToggle}
        />
      </div>

      <SearchSuggestionsDropdown
        adisos={suggestions.adisos}
        queries={suggestions.queries}
        activeIndex={activeSuggestIndex}
        onSelectAdiso={(adiso) => {
          if (onOpenAdiso) onOpenAdiso(adiso.id);
          else {
            onChange(adiso.titulo);
            void handleSearchSubmit();
          }
        }}
        onSelectQuery={(q) => onChange(q)}
        visible={isSearchMode && isTyping && (suggestions.adisos.length > 0 || suggestions.queries.length > 0)}
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
