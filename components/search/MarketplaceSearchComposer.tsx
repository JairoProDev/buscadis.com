'use client';

import { useState, useCallback, useMemo, useRef, useEffect, type KeyboardEvent } from 'react';
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
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '@/lib/search/recent-searches';

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
  /** En home browse: solo buscar (Publicar vive en nav/sidebar) */
  searchOnly?: boolean;
}

type SuggestItem =
  | { type: 'recent'; query: string }
  | { type: 'popular'; query: string }
  | { type: 'adiso'; adiso: SuggestAdiso }
  | { type: 'query'; query: string };

const LISTBOX_ID = 'search-suggestions';

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
  searchOnly = false,
}: MarketplaceSearchComposerProps) {
  const [composerMode, setComposerMode] = useState<ComposerMode>(initialMode);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [toggleExpanded, setToggleExpanded] = useState(false);
  const [activeSuggestIndex, setActiveSuggestIndex] = useState(-1);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const impressionKeyRef = useRef<string>('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isSearchMode = composerMode === 'search';
  const isTyping = value.trim().length >= 2;
  const isEmptyQuery = value.trim().length === 0;
  const collapseToggle = isTyping && !toggleExpanded;

  const {
    adisos: suggestAdisos,
    queries: suggestQueries,
    completion: suggestCompletion,
    popular: suggestPopular,
    loadPopular,
  } = useSearchSuggestions(value, isSearchMode);

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  const suggestItems = useMemo((): SuggestItem[] => {
    const items: SuggestItem[] = [];
    if (isEmptyQuery) {
      for (const q of recent) items.push({ type: 'recent', query: q });
      for (const q of suggestPopular) {
        if (!recent.some((r) => r.toLowerCase() === q.toLowerCase())) {
          items.push({ type: 'popular', query: q });
        }
      }
      return items;
    }
    for (const a of suggestAdisos) items.push({ type: 'adiso', adiso: a });
    for (const q of suggestQueries) items.push({ type: 'query', query: q });
    return items;
  }, [isEmptyQuery, recent, suggestPopular, suggestAdisos, suggestQueries]);

  const dropdownVisible =
    suggestionsOpen &&
    isSearchMode &&
    (isEmptyQuery
      ? recent.length > 0 || suggestPopular.length > 0
      : isTyping && (suggestAdisos.length > 0 || suggestQueries.length > 0));

  useEffect(() => {
    if (!dropdownVisible || suggestItems.length === 0) return;
    const key = suggestItems
      .map((i) => (i.type === 'adiso' ? i.adiso.id : `${i.type}:${i.query}`))
      .join('|');
    if (impressionKeyRef.current === key) return;
    impressionKeyRef.current = key;
    trackSearchEvent('search.suggest_impression', {
      query: value.trim() || undefined,
      count: suggestItems.length,
      emptyFocus: isEmptyQuery,
    });
  }, [dropdownVisible, suggestItems, value, isEmptyQuery]);

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

  const closeSuggestions = useCallback(() => {
    setSuggestionsOpen(false);
    setActiveSuggestIndex(-1);
  }, []);

  const openSuggestions = useCallback(() => {
    if (composerMode !== 'search') return;
    if (value.trim().length === 0) {
      setRecent(getRecentSearches());
      loadPopular();
      setSuggestionsOpen(true);
      return;
    }
    if (value.trim().length >= 2) {
      setSuggestionsOpen(true);
    }
  }, [composerMode, value, loadPopular]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!wrapperRef.current || !target) return;
      if (!wrapperRef.current.contains(target)) {
        closeSuggestions();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [closeSuggestions]);

  const handleComposerChange = (next: string) => {
    setActiveSuggestIndex(-1);
    if (composerMode !== 'publish') {
      if (next.trim().length === 0) {
        setRecent(getRecentSearches());
        loadPopular();
        setSuggestionsOpen(true);
      } else if (next.trim().length >= 2) {
        setSuggestionsOpen(true);
      } else {
        closeSuggestions();
      }
      onChange(next);
      return;
    }
    syncPhoneFromText(next);
    onChange(maskPhonesInText(next));
  };

  const publishText = removePhonesFromText(value).trim();
  const hasText = publishText.length > 0;
  const searchHasText = value.trim().length > 0;

  const handleSearchSubmit = useCallback(
    async (explicitQuery?: string) => {
      const q = (explicitQuery ?? value).trim();
      if (!q) {
        onNotify?.('Escribe qué buscas', 'info');
        return;
      }
      closeSuggestions();
      setRecent(addRecentSearch(q));
      await onSearchSubmit(q);
      trackSearchEvent('search.submit', { query: q });
    },
    [value, onSearchSubmit, onNotify, closeSuggestions],
  );

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

  const handleModalityQuery = useCallback(
    (q: string) => {
      void handleSearchSubmit(q);
    },
    [handleSearchSubmit],
  );

  const selectSuggestion = (index: number) => {
    const item = suggestItems[index];
    if (!item) return;
    if (item.type === 'adiso') {
      trackSearchEvent('search.suggest_click', {
        query: value.trim() || undefined,
        kind: 'adiso',
        adisoId: item.adiso.id,
      });
      if (onOpenAdiso) {
        onOpenAdiso(item.adiso.id);
      } else {
        onChange(item.adiso.titulo);
        void handleSearchSubmit(item.adiso.titulo);
      }
      closeSuggestions();
      return;
    }
    trackSearchEvent('search.suggest_click', {
      query: item.query,
      kind: item.type,
    });
    onChange(item.query);
    closeSuggestions();
    void handleSearchSubmit(item.query);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isSearchMode || suggestItems.length === 0) {
      if (e.key === 'Tab' && suggestCompletion && isSearchMode) {
        e.preventDefault();
        onChange(value + suggestCompletion);
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
    if (e.key === 'Tab' && suggestCompletion) {
      e.preventDefault();
      onChange(value + suggestCompletion);
      return;
    }
    if (e.key === 'Escape') {
      closeSuggestions();
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
        onFocus={() => {
          if (isTyping) setToggleExpanded(true);
          openSuggestions();
        }}
      >
        <Buscador
          value={value}
          onChange={handleComposerChange}
          compact={compact}
          searchOnly={searchOnly}
          composerMode={searchOnly ? 'search' : composerMode}
          onComposerModeChange={
            searchOnly
              ? undefined
              : (mode) => {
                  setComposerMode(mode);
                  if (mode === 'search') setPublishImageUrl(null);
                }
          }
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
          onModalityQuery={isSearchMode ? handleModalityQuery : undefined}
          suggestionsExpanded={dropdownVisible}
          suggestionsListboxId={LISTBOX_ID}
        />
      </div>

      <SearchSuggestionsDropdown
        listboxId={LISTBOX_ID}
        adisos={isEmptyQuery ? [] : suggestAdisos}
        queries={isEmptyQuery ? [] : suggestQueries}
        recent={isEmptyQuery ? recent : []}
        popular={isEmptyQuery ? suggestPopular : []}
        activeIndex={activeSuggestIndex}
        onSelectAdiso={(adiso) => {
          const index = suggestItems.findIndex(
            (i) => i.type === 'adiso' && i.adiso.id === adiso.id,
          );
          if (index >= 0) selectSuggestion(index);
        }}
        onSelectQuery={(q) => {
          const index = suggestItems.findIndex(
            (i) => (i.type === 'query' || i.type === 'recent' || i.type === 'popular') && i.query === q,
          );
          if (index >= 0) selectSuggestion(index);
          else {
            onChange(q);
            closeSuggestions();
            void handleSearchSubmit(q);
          }
        }}
        onRemoveRecent={(q) => setRecent(removeRecentSearch(q))}
        onClearRecent={() => {
          clearRecentSearches();
          setRecent([]);
        }}
        visible={dropdownVisible}
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
