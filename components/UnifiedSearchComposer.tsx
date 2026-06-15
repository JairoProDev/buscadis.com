'use client';

import { useEffect, useRef, useState } from 'react';
import Buscador, { ComposerMode } from './Buscador';
import { DraftListingCard, DraftListingData } from './ai/DraftListingCard';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { Categoria } from '@/types';
import { FREE_TIER_LIMITS } from '@/lib/publish/tiers';
import InterestPreviewPanel from './publish/InterestPreviewPanel';
import {
  extractPrimaryPhone,
  findPhoneMatches,
  maskPhonesInText,
  PHONE_MASK,
  removePhonesFromText,
} from '@/lib/phone';

type PublishTierChoice = 'free' | 'pro';

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
  /** Modo inicial al montar (p. ej. en /publicar) */
  initialMode?: ComposerMode;
}

const MIN_AI_LENGTH = 12;
const DEBOUNCE_MS = 700;

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
  const [publishTier, setPublishTier] = useState<PublishTierChoice>('free');
  const [intent, setIntent] = useState<'search' | 'publish' | null>(null);
  const [draft, setDraft] = useState<DraftListingData | null>(null);
  const [publishing, setPublishing] = useState(false);
  const detectedPhoneRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastCheckedRef = useRef('');

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

  useEffect(() => {
    if (composerMode !== 'publish' || publishTier !== 'pro') {
      if (composerMode === 'search') {
        setIntent(null);
        setDraft(null);
      }
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    const trimmed = removePhonesFromText(value).trim();
    if (trimmed.length < MIN_AI_LENGTH) {
      setIntent(null);
      setDraft(null);
      return;
    }

    timerRef.current = setTimeout(async () => {
      if (trimmed === lastCheckedRef.current) return;
      lastCheckedRef.current = trimmed;
      try {
        const res = await fetch('/api/ai/quick-compose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
        });
        const data = await res.json();
        if (data.intent === 'publish' && data.draft) {
          setIntent('publish');
          setDraft({ ...data.draft, imageUrl: '' });
          onCategoryDetected?.(data.draft.categoria);
        } else {
          setIntent('search');
          setDraft(null);
        }
      } catch {
        setIntent(null);
        setDraft(null);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, composerMode, publishTier, onCategoryDetected]);

  const resolveContacto = () =>
    detectedPhoneRef.current || extractPrimaryPhone(value, profile?.telefono);

  const handlePublishFree = async () => {
    if (!user?.id) {
      onNotify?.('Inicia sesión para publicar.', 'info');
      openAuthModal();
      return;
    }

    const text = removePhonesFromText(value).trim();
    if (!text) {
      onNotify?.('Escribe tu anuncio primero.', 'error');
      return;
    }

    const contacto = resolveContacto();
    if (!contacto) {
      onNotify?.('Incluye tu WhatsApp en el texto o configúralo en tu perfil.', 'error');
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/adisos/publish/free', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ text, contacto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      onNotify?.('¡Anuncio publicado gratis por 24h!', 'success');
      onChange('');
      detectedPhoneRef.current = profile?.telefono
        ? extractPrimaryPhone('', profile.telefono)
        : null;
    } catch (e) {
      onNotify?.(e instanceof Error ? e.message : 'No se pudo publicar', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishPro = async (data: DraftListingData) => {
    if (!user?.id) {
      openAuthModal();
      return;
    }
    window.location.href = `/publicar?titulo=${encodeURIComponent(data.titulo)}&descripcion=${encodeURIComponent(data.descripcion)}&categoria=${data.categoria}`;
  };

  const handlePrimaryAction = () => {
    if (composerMode === 'publish') {
      if (publishTier === 'free') {
        void handlePublishFree();
        return;
      }
      if (draft && intent === 'publish') {
        void handlePublishPro(draft);
      } else {
        onNotify?.('Sigue escribiendo para que la IA arme tu anuncio.', 'info');
      }
      return;
    }

    onNotify?.(value.trim() ? `Buscando: "${value.trim()}"` : 'Escribe qué buscas', value.trim() ? 'success' : 'info');
  };

  const freeLimit = FREE_TIER_LIMITS.maxDescChars + FREE_TIER_LIMITS.maxTitleChars;
  const publishText = removePhonesFromText(value).trim();
  const hasContact = Boolean(resolveContacto());
  const primaryDisabled =
    composerMode === 'publish'
      ? publishTier === 'free'
        ? !publishText || publishing
        : !draft || intent !== 'publish'
      : false;

  return (
    <div>
      <Buscador
        value={value}
        onChange={handleComposerChange}
        compact={compact}
        composerMode={composerMode}
        onComposerModeChange={setComposerMode}
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
            ? publishTier === 'free'
              ? publishing
                ? 'Publicando…'
                : 'Publicar'
              : 'Continuar'
            : 'Buscar'
        }
      />

      {composerMode === 'publish' && !compact && (
        <div className="mt-3 space-y-3 md:max-w-2xl md:mx-auto">
          <div className="flex gap-2 justify-center flex-wrap items-center">
            <button
              type="button"
              onClick={() => setPublishTier('free')}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                publishTier === 'free'
                  ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--brand-blue)]/40'
              }`}
            >
              Gratis · 24h
            </button>
            <button
              type="button"
              onClick={() => setPublishTier('pro')}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                publishTier === 'pro'
                  ? 'border-[var(--brand-yellow)] bg-[rgba(var(--brand-yellow-rgb),0.15)] text-[var(--brand-yellow)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--brand-yellow)]/50'
              }`}
            >
              Con IA · más alcance
            </button>
          </div>

          {publishTier === 'free' && (
            <p className="text-center text-[10px] text-[var(--text-tertiary)] m-0">
              {publishText.length}/{freeLimit} caracteres · 1 foto · sin IA
              {hasContact ? ' · WhatsApp detectado' : ' · incluye tu WhatsApp en el texto'}
            </p>
          )}

          {publishTier === 'pro' && intent === 'publish' && draft && (
            <>
              <InterestPreviewPanel
                categoria={draft.categoria}
                titulo={draft.titulo}
                descripcion={draft.descripcion}
              />
              <DraftListingCard
                data={draft}
                onPublish={handlePublishPro}
                onCancel={() => {
                  setDraft(null);
                  setIntent(null);
                }}
              />
            </>
          )}

          {publishTier === 'pro' && intent === 'search' && publishText.length >= MIN_AI_LENGTH && (
            <p className="text-center text-xs text-[var(--text-tertiary)]">
              Sigue escribiendo como un anuncio para que la IA lo arme.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
