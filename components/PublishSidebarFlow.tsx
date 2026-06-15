'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { DraftListingCard, DraftListingData } from './ai/DraftListingCard';
import { FREE_TIER_LIMITS } from '@/lib/publish/tiers';
import InterestPreviewPanel from './publish/InterestPreviewPanel';
import { Categoria } from '@/types';

type Step = 1 | 2 | 3;

export default function PublishSidebarFlow({
  onNotify,
}: {
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
}) {
  const { user, profile, session } = useAuth();
  const { openAuthModal } = useUI();
  const [step, setStep] = useState<Step>(1);
  const [text, setText] = useState('');
  const [tier, setTier] = useState<'free' | 'pro'>('free');
  const [draft, setDraft] = useState<DraftListingData | null>(null);
  const [contacto, setContacto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.telefono) setContacto(profile.telefono);
  }, [profile?.telefono]);

  const analyzeWithAi = async () => {
    const res = await fetch('/api/ai/quick-compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() }),
    });
    const data = await res.json();
    if (data.draft) {
      setDraft(data.draft);
      setStep(2);
    } else {
      onNotify?.('Escribe un poco más para que la IA entienda tu anuncio.', 'info');
    }
  };

  const handleStep1Next = async () => {
    if (!text.trim()) return;
    if (tier === 'pro') {
      setLoading(true);
      try {
        await analyzeWithAi();
      } finally {
        setLoading(false);
      }
    } else {
      setStep(2);
    }
  };

  const publishFree = async () => {
    if (!user?.id) {
      openAuthModal();
      return;
    }
    if (!contacto.trim()) {
      onNotify?.('Agrega tu WhatsApp', 'error');
      return;
    }
    setLoading(true);
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
      if (!res.ok) throw new Error(data.error);
      onNotify?.('Publicado gratis por 24h', 'success');
      setStep(1);
      setText('');
    } catch (e) {
      onNotify?.(e instanceof Error ? e.message : 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const goPaid = () => {
    const q = draft
      ? `?titulo=${encodeURIComponent(draft.titulo)}&descripcion=${encodeURIComponent(draft.descripcion)}&categoria=${draft.categoria}`
      : `?text=${encodeURIComponent(text)}`;
    window.location.href = `/publicar${q}`;
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex gap-2 text-xs font-semibold text-[var(--text-tertiary)]">
        {([1, 2, 3] as Step[]).map((s) => (
          <span
            key={s}
            className={step >= s ? 'text-[var(--brand-blue)]' : ''}
          >
            {s}. {s === 1 ? 'Describe' : s === 2 ? 'Revisa' : 'Publica'}
          </span>
        ))}
      </div>

      {step === 1 && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Describe tu aviso…"
            className="w-full rounded-xl border border-[var(--border-color)] p-3 text-sm resize-none bg-[var(--bg-secondary)]"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTier('free')}
              className={`flex-1 py-2 text-xs rounded-lg border ${tier === 'free' ? 'border-[var(--brand-blue)] text-[var(--brand-blue)]' : ''}`}
            >
              Gratis
            </button>
            <button
              type="button"
              onClick={() => setTier('pro')}
              className={`flex-1 py-2 text-xs rounded-lg border ${tier === 'pro' ? 'border-[var(--brand-yellow)]' : ''}`}
            >
              Con IA
            </button>
          </div>
          <button
            type="button"
            disabled={loading || !text.trim()}
            onClick={() => void handleStep1Next()}
            className="w-full py-2.5 rounded-xl bg-[var(--brand-blue)] text-white font-bold text-sm disabled:opacity-50"
          >
            {loading ? 'Analizando…' : 'Siguiente'}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          {tier === 'pro' && draft ? (
            <DraftListingCard
              data={draft}
              onPublish={() => setStep(3)}
              onCancel={() => setStep(1)}
            />
          ) : (
            <div className="rounded-xl border p-3 text-sm bg-[var(--bg-secondary)]">
              <p className="font-semibold m-0 mb-1">{text.slice(0, FREE_TIER_LIMITS.maxTitleChars)}</p>
              <p className="text-[var(--text-secondary)] m-0 text-xs line-clamp-4">{text}</p>
            </div>
          )}
          {tier === 'pro' && draft && (
            <InterestPreviewPanel
              categoria={draft.categoria as Categoria}
              titulo={draft.titulo}
              descripcion={draft.descripcion}
            />
          )}
          <button
            type="button"
            onClick={() => setStep(3)}
            className="w-full py-2.5 rounded-xl bg-[var(--brand-blue)] text-white font-bold text-sm"
          >
            Continuar
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <input
            type="tel"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            placeholder="WhatsApp"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {tier === 'free' ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void publishFree()}
              className="w-full py-2.5 rounded-xl bg-[var(--brand-blue)] text-white font-bold text-sm"
            >
              Publicar gratis
            </button>
          ) : (
            <button
              type="button"
              onClick={goPaid}
              className="w-full py-2.5 rounded-xl bg-[var(--brand-yellow)] text-[#1a1a1a] font-bold text-sm"
            >
              Elegir paquete y publicar
            </button>
          )}
        </>
      )}
    </div>
  );
}
