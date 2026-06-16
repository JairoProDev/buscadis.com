'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { IconClose } from '@/components/Icons';
import DealBoostSelector from './DealBoostSelector';
import { DEAL_TIERS, DealPromotionTier } from '@/types';

interface DealPublishWizardProps {
  open: boolean;
  onClose: () => void;
  defaultAdisoId?: string;
  businessProfileId?: string;
}

type Step = 'media' | 'link' | 'copy' | 'boost';

export default function DealPublishWizard({
  open,
  onClose,
  defaultAdisoId = '',
  businessProfileId = '',
}: DealPublishWizardProps) {
  const { session } = useAuth();
  const token = session?.access_token;
  const [step, setStep] = useState<Step>('media');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [adisoId, setAdisoId] = useState(defaultAdisoId);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [priceOriginal, setPriceOriginal] = useState('');
  const [tier, setTier] = useState<DealPromotionTier>('gratis');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const onFileChange = (f: File | null) => {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const suggestCopy = async () => {
    try {
      const res = await fetch('/api/deals/suggest-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categoria: '',
          priceDisplay: priceDisplay ? Number(priceDisplay) : undefined,
        }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setTitle(data.suggestions.title);
        setCaption(data.suggestions.caption);
        setHashtags(data.suggestions.hashtags.join(', '));
        return;
      }
    } catch {
      // fallback
    }
    if (!title && adisoId) {
      setTitle(`Oferta especial — aviso ${adisoId.slice(0, 8)}`);
    }
    setCaption((c) => c || 'Aprovecha antes de que se acabe. Escríbeme por WhatsApp.');
    setHashtags((h) => h || 'oferta, deal, peru');
  };

  const publish = async () => {
    if (!token || !file || !adisoId.trim()) {
      setError('Completa media y aviso vinculado');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('adisoId', adisoId.trim());
      fd.append('title', title);
      fd.append('caption', caption);
      fd.append('hashtags', hashtags);
      fd.append('tier', tier);
      if (priceDisplay) fd.append('priceDisplay', priceDisplay);
      if (priceOriginal) fd.append('priceOriginal', priceOriginal);
      if (businessProfileId) fd.append('businessProfileId', businessProfileId);

      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al publicar');

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      onClose();
      window.location.href = '/deals';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/60 md:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-[var(--bg-primary)] p-5 md:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Publicar Deal</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <IconClose size={22} />
          </button>
        </div>

        {!token && (
          <p className="mb-4 text-sm text-red-500">Inicia sesión para publicar</p>
        )}

        {step === 'media' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">Video o imagen vertical 9:16 (máx. 25 MB)</p>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
            {preview && (
              <div className="aspect-[9/16] max-h-64 overflow-hidden rounded-xl bg-black">
                {file?.type.startsWith('video/') ? (
                  <video src={preview} className="h-full w-full object-cover" controls muted />
                ) : (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            )}
            <button
              type="button"
              disabled={!file}
              onClick={() => setStep('link')}
              className="w-full rounded-xl bg-[var(--brand-blue)] py-3 font-bold text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}

        {step === 'link' && (
          <div className="space-y-4">
            <label className="block text-sm font-medium">ID del aviso vinculado *</label>
            <input
              value={adisoId}
              onChange={(e) => setAdisoId(e.target.value)}
              placeholder="Pega el ID de tu aviso publicado"
              className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm"
            />
            <button type="button" onClick={() => setStep('media')} className="text-sm text-[var(--brand-blue)]">
              ← Atrás
            </button>
            <button
              type="button"
              disabled={!adisoId.trim()}
              onClick={() => {
                suggestCopy();
                setStep('copy');
              }}
              className="w-full rounded-xl bg-[var(--brand-blue)] py-3 font-bold text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}

        {step === 'copy' && (
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título comercial"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              maxLength={120}
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Descripción / gancho"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              rows={3}
              maxLength={500}
            />
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="Hashtags (oferta, lima, ...)"
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={priceDisplay}
                onChange={(e) => setPriceDisplay(e.target.value)}
                placeholder="Precio oferta"
                type="number"
                className="rounded-xl border px-3 py-2 text-sm"
              />
              <input
                value={priceOriginal}
                onChange={(e) => setPriceOriginal(e.target.value)}
                placeholder="Precio original"
                type="number"
                className="rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <button type="button" onClick={() => setStep('link')} className="text-sm text-[var(--brand-blue)]">
              ← Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep('boost')}
              className="w-full rounded-xl bg-[var(--brand-blue)] py-3 font-bold text-white"
            >
              Siguiente
            </button>
          </div>
        )}

        {step === 'boost' && (
          <div className="space-y-4">
            <DealBoostSelector value={tier} onChange={setTier} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="button" onClick={() => setStep('copy')} className="text-sm text-[var(--brand-blue)]">
              ← Atrás
            </button>
            <button
              type="button"
              disabled={loading || !token}
              onClick={publish}
              className="w-full rounded-xl bg-[var(--brand-yellow)] py-3 font-bold text-black disabled:opacity-50"
            >
              {loading ? 'Publicando...' : tier === 'gratis' ? 'Publicar gratis' : `Publicar · S/ ${DEAL_TIERS[tier].precio}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
