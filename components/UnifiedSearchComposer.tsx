'use client';

import { useEffect, useRef, useState } from 'react';
import Buscador from './Buscador';
import { DraftListingCard, DraftListingData } from './ai/DraftListingCard';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { Categoria } from '@/types';
import { IconSearch, IconMegaphone } from './Icons';
import { FREE_TIER_LIMITS } from '@/lib/publish/tiers';
import InterestPreviewPanel from './publish/InterestPreviewPanel';

type ComposerMode = 'search' | 'publish';
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
}: UnifiedSearchComposerProps) {
  const { user, profile, session } = useAuth();
  const { openAuthModal } = useUI();
  const [composerMode, setComposerMode] = useState<ComposerMode>('search');
  const [publishTier, setPublishTier] = useState<PublishTierChoice>('free');
  const [intent, setIntent] = useState<'search' | 'publish' | null>(null);
  const [draft, setDraft] = useState<DraftListingData | null>(null);
  const [contacto, setContacto] = useState('');
  const [publishing, setPublishing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastCheckedRef = useRef('');

  useEffect(() => {
    if (profile?.telefono) setContacto(profile.telefono);
  }, [profile?.telefono]);

  useEffect(() => {
    if (composerMode !== 'publish' || publishTier !== 'pro') {
      if (composerMode === 'search') {
        setIntent(null);
        setDraft(null);
      }
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    const trimmed = value.trim();
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

  const handlePublishFree = async () => {
    if (!user?.id) {
      onNotify?.('Inicia sesión para publicar.', 'info');
      openAuthModal();
      return;
    }
    const text = value.trim();
    if (!text) {
      onNotify?.('Escribe tu anuncio primero.', 'error');
      return;
    }
    if (!contacto.trim()) {
      onNotify?.('Agrega tu número de WhatsApp.', 'error');
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
        body: JSON.stringify({ text, contacto: contacto.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      onNotify?.('¡Anuncio publicado gratis por 24h!', 'success');
      onChange('');
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

  const charCount = value.length;
  const freeLimit = FREE_TIER_LIMITS.maxDescChars + FREE_TIER_LIMITS.maxTitleChars;

  return (
    <div>
      {!compact && (
        <div className="flex justify-center gap-1 mb-2 p-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setComposerMode('search')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-colors ${
              composerMode === 'search'
                ? 'bg-[var(--brand-blue)] text-white'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <IconSearch size={14} /> Buscar
          </button>
          <button
            type="button"
            onClick={() => setComposerMode('publish')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-colors ${
              composerMode === 'publish'
                ? 'bg-[var(--brand-yellow)] text-[#1a1a1a]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <IconMegaphone size={14} /> Publicar
          </button>
        </div>
      )}

      <Buscador
        value={value}
        onChange={onChange}
        compact={compact}
        onCategoryDetected={onCategoryDetected}
        onNotify={onNotify}
        showFilterToggle={showFilterToggle}
        filtersVisible={filtersVisible}
        onToggleFilters={onToggleFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {composerMode === 'publish' && !compact && (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => setPublishTier('free')}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
                publishTier === 'free'
                  ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              Gratis · 24h
            </button>
            <button
              type="button"
              onClick={() => setPublishTier('pro')}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
                publishTier === 'pro'
                  ? 'border-[var(--brand-yellow)] bg-[rgba(var(--brand-yellow-rgb),0.15)] text-[#b8860b]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              Con IA · más alcance
            </button>
          </div>

          {publishTier === 'free' && (
            <div className="rounded-xl border border-[var(--border-color)] p-3 bg-[var(--bg-secondary)] space-y-2">
              <input
                type="tel"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Tu WhatsApp"
                className="w-full rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm bg-[var(--bg-primary)]"
              />
              <p className="text-[10px] text-[var(--text-tertiary)] m-0">
                {charCount}/{freeLimit} caracteres · 1 foto · sin IA · atención manual
              </p>
              <button
                type="button"
                disabled={publishing || !value.trim()}
                onClick={() => void handlePublishFree()}
                className="w-full py-2.5 rounded-xl bg-[var(--brand-blue)] text-white text-sm font-bold disabled:opacity-50"
              >
                {publishing ? 'Publicando…' : 'Publicar gratis'}
              </button>
            </div>
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

          {publishTier === 'pro' && intent === 'search' && value.trim().length >= MIN_AI_LENGTH && (
            <p className="text-center text-xs text-[var(--text-tertiary)]">
              Sigue escribiendo como un anuncio para que la IA lo arme.
            </p>
          )}
        </div>
      )}

      {composerMode === 'search' && intent && !compact && (
        <div className="flex items-center justify-center mt-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]">
            <IconSearch size={12} /> Buscando en Buscadis
          </span>
        </div>
      )}
    </div>
  );
}
