'use client';

import { useRef, useState, useEffect, useCallback, type KeyboardEvent } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { IconMicrophone, IconGoogleLens, IconFilterFunnel, IconSearch, IconMegaphone, IconImage } from './Icons';
import ComposerModeToggle, { type ComposerMode } from './ComposerModeToggle';
import { AnimatePresence, motion } from 'framer-motion';
import { Categoria } from '@/types';

export type { ComposerMode };

interface BuscadorProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  /** Panel lateral: delgado, sin botones de acción */
  minimal?: boolean;
  onCategoryDetected?: (categoria: Categoria) => void;
  onNotify?: (message: string, type?: 'info' | 'error' | 'success') => void;
  /** Muestra el botón de embudo en la barra de acciones (solo buscador principal) */
  showFilterToggle?: boolean;
  filtersVisible?: boolean;
  onToggleFilters?: () => void;
  activeFiltersCount?: number;
  /** Alternador Buscar / Publicar integrado en la barra */
  composerMode?: ComposerMode;
  onComposerModeChange?: (mode: ComposerMode) => void;
  placeholder?: string;
  /** Acción principal al final de la barra (buscar / publicar) */
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  primaryActionLoading?: boolean;
  primaryActionLabel?: string;
  /** Solo ícono en el botón principal (sin texto) */
  primaryIconOnly?: boolean;
  /** Adjuntar foto al publicar (modo publish) */
  onPublishImageSelected?: (file: File) => void;
  publishImageAttached?: boolean;
  publishImageUploading?: boolean;
  /** Barra plana sin borde animado (panel lateral) */
  flat?: boolean;
  /** Colapsar toggle Buscar/Publicar a solo íconos (p. ej. mientras escribe) */
  forceModeToggleIconsOnly?: boolean;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}

export default function Buscador({
  value,
  onChange,
  compact = false,
  minimal = false,
  onCategoryDetected,
  onNotify,
  showFilterToggle = false,
  filtersVisible = false,
  onToggleFilters,
  activeFiltersCount = 0,
  composerMode = 'search',
  onComposerModeChange,
  placeholder: placeholderProp,
  onPrimaryAction,
  primaryActionDisabled = false,
  primaryActionLoading = false,
  primaryActionLabel,
  onPublishImageSelected,
  publishImageAttached = false,
  publishImageUploading = false,
  flat = false,
  primaryIconOnly = false,
  forceModeToggleIconsOnly = false,
}: BuscadorProps) {
  const { t } = useTranslation();
  const { isListening, isSupported, start: startVoice, stop: stopVoice } = useSpeechRecognition('es-PE');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const publishImageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const singleLineHeightRef = useRef<number>(0);
  const [fieldMultiline, setFieldMultiline] = useState(false);

  const showComposerToggle = Boolean(onComposerModeChange) && !minimal;
  const isPublishMode = showComposerToggle && composerMode === 'publish';

  const measureSingleLineHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return 0;
    const prev = el.value;
    el.value = '';
    el.style.height = 'auto';
    const h = el.scrollHeight;
    el.value = prev;
    singleLineHeightRef.current = h;
    return h;
  }, []);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    const singleLine =
      singleLineHeightRef.current || measureSingleLineHeight() || 24;

    el.style.height = `${singleLine}px`;
    const contentHeight = el.scrollHeight;
    const maxPx = 220;
    const next = Math.min(Math.max(contentHeight, singleLine), maxPx);

    el.style.height = `${next}px`;
    setFieldMultiline(next > singleLine + 2);
  }, [measureSingleLineHeight]);

  useEffect(() => {
    if (!isPublishMode) {
      setFieldMultiline(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      measureSingleLineHeight();
      adjustTextareaHeight();
    });
    return () => cancelAnimationFrame(id);
  }, [isPublishMode, value, adjustTextareaHeight, measureSingleLineHeight]);

  const defaultPlaceholder =
    composerMode === 'publish'
      ? 'Publica ofertas y oportunidades…'
      : t('search.placeholder') || 'Buscar ofertas y oportunidades…';
  const placeholder = placeholderProp || defaultPlaceholder;

  const notify = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    onNotify?.(message, type);
  };

  const handleVoiceSearch = () => {
    if (isListening) {
      stopVoice();
      return;
    }

    if (!isSupported) {
      notify('Tu navegador no soporta búsqueda por voz. Usa Chrome o Edge en desktop/Android.', 'error');
      return;
    }

    startVoice(
      (transcript) => {
        onChange(transcript);
        notify(`Buscando: "${transcript}"`, 'success');
      },
      (message) => notify(message, 'error')
    );
  };

  const handleImageSelected = async (file: File | null | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Selecciona un archivo de imagen (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      notify('La imagen es muy grande. Usa una menor a 8 MB.', 'error');
      return;
    }

    setIsAnalyzingImage(true);
    notify('Analizando imagen…', 'info');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const response = await fetch('/api/ai/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 503 && data.fallback) {
          notify('IA visual no disponible aquí. Escribe en el buscador qué viste en la foto.', 'error');
          return;
        }
        throw new Error(data.error || 'Error al analizar la imagen');
      }

      if (data.query) {
        onChange(String(data.query));
        if (data.category && onCategoryDetected) {
          onCategoryDetected(data.category as Categoria);
        }
        notify(`Búsqueda visual: "${data.query}"`, 'success');
        return;
      }

      notify('No encontramos palabras clave en la imagen. Prueba con otra foto.', 'error');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo analizar la imagen';
      notify(message, 'error');
    } finally {
      setIsAnalyzingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const isCompact = compact && !minimal;
  const actionBtnClass = flat
    ? 'flex items-center justify-center rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none w-7 h-7 shrink-0'
    : 'flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:pointer-events-none w-8 h-8 md:w-10 md:h-10 shrink-0';

  const radiusClass = flat || minimal ? 'rounded-xl' : isCompact ? 'rounded-xl' : 'rounded-2xl';
  const shellPadding = minimal
    ? 'px-2.5 py-1'
    : flat
      ? 'px-2 py-1'
      : isCompact
        ? 'px-3 py-2'
        : 'px-3 py-2 md:px-4 md:py-3';
  const iconSize = minimal ? 16 : flat ? 14 : isCompact ? 18 : 20;
  const searchIconClass = minimal ? 'w-4 h-4 mr-2' : 'w-5 h-5 mr-2 md:mr-3';
  const shellAlign = flat ? 'items-center' : fieldMultiline && isPublishMode ? 'items-start' : 'items-center';
  const fieldMinH = flat ? 'h-8' : 'min-h-[36px] md:min-h-[40px]';
  const showPrimaryAction = Boolean(onPrimaryAction) && showComposerToggle;

  const handleFieldKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!onPrimaryAction || e.key !== 'Enter') return;
    if (isPublishMode && e.shiftKey) return;
    e.preventDefault();
    if (!primaryActionDisabled && !primaryActionLoading) onPrimaryAction();
  };

  const primaryLabel =
    primaryActionLabel ??
    (composerMode === 'publish' ? (primaryActionLoading ? '…' : 'Publicar') : 'Buscar');
  const showPrimaryText = !primaryIconOnly && Boolean(primaryLabel?.trim());

  const modeToggle = showComposerToggle ? (
    <ComposerModeToggle
      mode={composerMode}
      onChange={(m) => onComposerModeChange?.(m)}
      iconsOnly={flat || forceModeToggleIconsOnly}
      className={isPublishMode && fieldMultiline && !flat ? 'self-center' : ''}
    />
  ) : null;

  const flatFieldClass =
    'brand-search-input w-full min-w-0 flex-1 border-none outline-none bg-transparent truncate text-sm h-8 leading-8 py-0';

  const shellInner = (
    <>
      {modeToggle}

      <div className={`composer-field-wrap flex-1 min-w-0 flex items-center overflow-hidden ${fieldMinH}`}>
        {!showComposerToggle && (
          <FaSearch className={`${searchIconClass} text-[var(--brand-blue)] flex-shrink-0 transition-transform group-focus-within:scale-110`} />
        )}

        <AnimatePresence mode="wait" initial={false}>
          {isPublishMode ? (
            flat ? (
              <motion.input
                key="publish-field-flat"
                type="text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.24, ease: [0.34, 1.2, 0.64, 1] }}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleFieldKeyDown}
                className={flatFieldClass}
              />
            ) : (
              <motion.div
                key="publish-field"
                className="flex-1 min-w-0 w-full"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.24, ease: [0.34, 1.2, 0.64, 1] }}
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onInput={adjustTextareaHeight}
                  onKeyDown={handleFieldKeyDown}
                  className={`brand-search-input brand-search-textarea w-full border-none outline-none bg-transparent resize-none overflow-y-auto max-h-[220px] text-[16px] leading-[36px] md:leading-[40px] ${
                    fieldMultiline ? 'py-1' : 'py-0 h-9 md:h-10'
                  }`}
                />
              </motion.div>
            )
          ) : (
            <motion.input
              key="search-field"
              type="search"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.24, ease: [0.34, 1.2, 0.64, 1] }}
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleFieldKeyDown}
              className={`brand-search-input flex-1 min-w-0 w-full border-none outline-none bg-transparent truncate ${fieldMinH} ${
                minimal || flat ? 'text-sm py-0' : 'text-[16px] py-0 h-9 md:h-10'
              }`}
            />
          )}
        </AnimatePresence>
      </div>

      {!minimal && (
        <motion.div
          layout
          className={`brand-search-divider flex items-center shrink-0 gap-0 border-l ${
            flat ? 'ml-1 pl-1 gap-0' : 'ml-1 pl-1 md:gap-0.5 md:ml-2 md:pl-2'
          } ${isPublishMode && fieldMultiline && !flat ? 'self-start mt-1' : ''}`}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          {showFilterToggle && onToggleFilters && composerMode === 'search' && (
            <button
              type="button"
              onClick={onToggleFilters}
              className={`${actionBtnClass} relative ${
                filtersVisible
                  ? 'text-[var(--brand-blue)] bg-[var(--hover-bg)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--brand-blue)] hover:bg-[var(--hover-bg)]'
              }`}
              title={filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros'}
              aria-label={filtersVisible ? 'Ocultar filtros' : 'Mostrar filtros'}
              aria-pressed={filtersVisible}
            >
              <IconFilterFunnel size={iconSize} />
              {activeFiltersCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--brand-blue)] border border-[var(--search-bg,var(--bg-primary))] rounded-full" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleVoiceSearch}
            disabled={isAnalyzingImage || publishImageUploading}
            className={`${actionBtnClass} ${
              isListening
                ? 'text-red-500 bg-red-500/10 animate-pulse'
                : 'text-[var(--brand-blue)]/80 hover:text-[var(--brand-blue)] hover:bg-[var(--hover-bg)]'
            }`}
            title={isListening ? 'Escuchando… (tocar para detener)' : 'Búsqueda por voz'}
            aria-label={isListening ? 'Detener búsqueda por voz' : 'Búsqueda por voz'}
            aria-pressed={isListening}
          >
            <IconMicrophone size={iconSize} />
          </button>

          {isPublishMode && onPublishImageSelected ? (
            <button
              type="button"
              onClick={() => publishImageInputRef.current?.click()}
              disabled={publishImageUploading || isListening}
              className={`${actionBtnClass} relative ${
                publishImageAttached
                  ? 'text-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.12)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--brand-blue)] hover:bg-[var(--hover-bg)]'
              } ${publishImageUploading ? 'animate-pulse' : ''}`}
              title={publishImageAttached ? 'Foto adjunta · tocar para cambiar' : 'Adjuntar foto'}
              aria-label="Adjuntar foto al anuncio"
            >
              <IconImage size={iconSize} />
              {publishImageAttached && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--brand-blue)] border border-[var(--search-bg,var(--bg-primary))] rounded-full" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
                if (isMobile && cameraInputRef.current) {
                  cameraInputRef.current.click();
                } else if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              disabled={isAnalyzingImage || isListening}
              className={`${actionBtnClass} text-[var(--text-secondary)] hover:text-[var(--brand-yellow)] hover:bg-[rgba(var(--brand-yellow-rgb),0.12)] ${
                isAnalyzingImage ? 'animate-pulse text-[var(--brand-yellow)]' : ''
              }`}
              title="Búsqueda visual (foto)"
              aria-label="Búsqueda visual con foto"
            >
              <IconGoogleLens size={iconSize} />
            </button>
          )}

          {showPrimaryAction && (
            <motion.button
              type="button"
              layout
              onClick={onPrimaryAction}
              disabled={primaryActionDisabled || primaryActionLoading}
              whileTap={{ scale: 0.94 }}
              className={`flex items-center justify-center font-bold shrink-0 transition-all disabled:opacity-45 disabled:pointer-events-none ml-0.5 ${
                flat
                  ? 'rounded-lg w-7 h-7'
                  : 'rounded-full gap-1 h-8 md:h-9 px-2.5 md:px-3.5 text-[11px] md:text-xs'
              } ${
                isPublishMode
                  ? 'bg-[var(--brand-yellow)] text-[#1c1608] shadow-[0_2px_10px_rgba(var(--brand-yellow-rgb),0.45)] hover:brightness-105'
                  : 'bg-[var(--brand-blue)] text-white shadow-[0_2px_10px_rgba(var(--brand-primary-rgb),0.35)] hover:brightness-105'
              }`}
              title={primaryLabel || 'Enviar'}
              aria-label={primaryLabel || 'Enviar'}
            >
              {primaryActionLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPublishMode ? (
                flat || primaryIconOnly ? (
                  <IconMegaphone size={flat || compact ? 13 : 14} color="currentColor" />
                ) : (
                  <>
                    <IconMegaphone size={14} color="currentColor" />
                    {showPrimaryText && <span className="hidden sm:inline">{primaryLabel}</span>}
                  </>
                )
              ) : flat || primaryIconOnly ? (
                <IconSearch size={flat || compact ? 13 : 14} color="currentColor" />
              ) : (
                <>
                  <IconSearch size={14} color="currentColor" />
                  {showPrimaryText && <span className="hidden sm:inline">{primaryLabel}</span>}
                </>
              )}
            </motion.button>
          )}
        </motion.div>
      )}
    </>
  );

  const shellClassName = `
    brand-search-shell relative flex flex-nowrap ${shellAlign} ${radiusClass} ${shellPadding}
    transition-all duration-300 motion-reduce:transition-none
    ${isPublishMode ? 'composer-mode-publish' : ''}
    ${flat ? 'gap-0.5' : ''}
  `;

  return (
    <div
      className={`transition-all duration-300 ${
        minimal || flat ? '' : `-mx-4 px-4 ${isCompact ? 'py-1' : 'py-2'} md:mx-0 md:px-0`
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageSelected(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleImageSelected(e.target.files?.[0])}
      />

      <input
        ref={publishImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onPublishImageSelected) onPublishImageSelected(file);
          if (publishImageInputRef.current) publishImageInputRef.current.value = '';
        }}
      />

      <div className={`relative group z-30 ${minimal || flat ? 'w-full' : 'md:mx-auto md:max-w-2xl'}`}>
        {flat ? (
          <div
            className={`${shellClassName} ring-1 ring-black/[0.06] focus-within:ring-2 focus-within:ring-[var(--brand-blue)]/35 ${
              isPublishMode ? 'ring-[rgba(var(--brand-yellow-rgb),0.35)]' : ''
            }`}
          >
            {shellInner}
          </div>
        ) : (
          <div
            className={`brand-search-glow relative ${radiusClass} ${minimal ? 'p-[1px]' : 'p-[2px]'} ${
              isPublishMode ? 'composer-mode-publish' : ''
            }`}
          >
            <div
              className={`${shellClassName} ${minimal ? '' : 'hover:-translate-y-0.5 motion-reduce:hover:translate-y-0'} focus-within:ring-2 focus-within:ring-[var(--brand-blue)]/35 dark:focus-within:ring-[var(--brand-blue)]/50 focus-within:shadow-[0_8px_24px_rgba(var(--brand-primary-rgb),0.18)]`}
            >
              {shellInner}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
