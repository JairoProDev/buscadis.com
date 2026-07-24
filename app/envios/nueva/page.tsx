'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import EnviosPointPicker, {
  type EnviosMapPoint,
} from '@/components/envios/EnviosPointPicker';
import { useAuth } from '@/hooks/useAuth';
import {
  MOTO_CATEGORIES,
  MOTO_CATEGORY_LABELS,
  type MotoCategory,
  estimateDistanceKm,
  estimateFare,
  formatFareSoles,
} from '@/lib/envios';
import { IconArrowLeft } from '@/components/Icons';

const STEPS = ['qué', 'recojo', 'destino', 'cuando', 'resumen'] as const;
type Step = (typeof STEPS)[number];

const OTRO_HINTS = ['urgente', 'frágil', 'pequeño', 'documento', 'llaves'];

export default function NuevaEnvioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('qué');
  const [category, setCategory] = useState<MotoCategory | null>(null);
  const [description, setDescription] = useState('');
  const [pickup, setPickup] = useState<EnviosMapPoint | null>(null);
  const [dropoff, setDropoff] = useState<EnviosMapPoint | null>(null);
  const [whenType, setWhenType] = useState<'ahora' | 'programado'>('ahora');
  const [scheduledAt, setScheduledAt] = useState('');
  const [budget, setBudget] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [tip, setTip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const farePreview = useMemo(() => {
    if (!pickup || !dropoff) return null;
    const km = estimateDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    return { km, fare: estimateFare(km) };
  }, [pickup, dropoff]);

  const stepIndex = STEPS.indexOf(step);

  const canNext = () => {
    if (step === 'qué') {
      if (!category) return false;
      if (description.trim().length < 3) return false;
      return true;
    }
    if (step === 'recojo') return !!pickup;
    if (step === 'destino') return !!dropoff;
    if (step === 'cuando') {
      if (whenType === 'programado' && !scheduledAt) return false;
      return true;
    }
    return true;
  };

  const goNext = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  };

  const goBack = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/envios/upload-package', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      setPhotoUrl(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al subir foto');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/envios/nueva')}`);
      return;
    }
    if (!category || !pickup || !dropoff) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/envios/requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: description.trim(),
          photo_url: photoUrl,
          pickup,
          dropoff,
          when_type: whenType,
          scheduled_at: whenType === 'programado' ? new Date(scheduledAt).toISOString() : null,
          budget_estimate: category === 'mandado' && budget ? Number(budget) : null,
          tip_amount: tip ? Number(tip) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo crear');
      router.push(`/envios/${data.request.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/envios"
            className="rounded-full p-2 hover:bg-[var(--hover-bg)]"
            aria-label="Volver"
          >
            <IconArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Nuevo envío</h1>
            <div className="mt-1 flex gap-1">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${
                    i <= stepIndex ? 'bg-[var(--brand-blue)]' : 'bg-[var(--border-color)]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {step === 'qué' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">¿Qué vas a enviar?</p>
            <div className="grid grid-cols-1 gap-2">
              {MOTO_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    category === c
                      ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                      : 'border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  {MOTO_CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                Descripción {category === 'otro' ? '(obligatoria — sé específico)' : ''}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={
                  category === 'otro'
                    ? 'Ej: llegar a San Sebastián, llaves en Nogales, caja pequeña…'
                    : 'Ej: sobre A4, bolsa de farmacia, caja mediana…'
                }
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]"
              />
              {category === 'otro' && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {OTRO_HINTS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() =>
                        setDescription((d) => (d ? `${d} ${h}` : h).trim())
                      }
                      className="rounded-full border border-[var(--border-color)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {category === 'mandado' && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Presupuesto estimado (S/)
                </label>
                <input
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Cuánto adelantará el motorizado"
                  className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]"
                />
              </div>
            )}
          </div>
        )}

        {step === 'recojo' && (
          <EnviosPointPicker
            label="Punto de recojo"
            value={pickup}
            onChange={setPickup}
            autoLocate
          />
        )}

        {step === 'destino' && (
          <EnviosPointPicker
            label="Punto de entrega"
            value={dropoff}
            onChange={setDropoff}
          />
        )}

        {step === 'cuando' && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">¿Cuándo lo necesitas?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWhenType('ahora')}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  whenType === 'ahora'
                    ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                    : 'border-[var(--border-color)]'
                }`}
              >
                Ahora
              </button>
              <button
                type="button"
                onClick={() => setWhenType('programado')}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  whenType === 'programado'
                    ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]'
                    : 'border-[var(--border-color)]'
                }`}
              >
                Programar
              </button>
            </div>
            {whenType === 'programado' && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm"
              />
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Foto (opcional)</label>
              <input
                type="file"
                accept="image/*"
                disabled={uploading || !user}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPhoto(f);
                }}
                className="block w-full text-sm"
              />
              {!user && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Inicia sesión para subir foto
                </p>
              )}
              {photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="mt-2 h-24 rounded-lg object-cover" />
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Propina opcional (S/)
              </label>
              <input
                type="number"
                min={0}
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        )}

        {step === 'resumen' && (
          <div className="space-y-4 rounded-2xl border border-[var(--border-color)] p-4">
            <h2 className="font-bold text-[var(--text-primary)]">Confirma tu envío</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[var(--text-secondary)]">Tipo</dt>
                <dd className="font-medium">
                  {category ? MOTO_CATEGORY_LABELS[category] : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Detalle</dt>
                <dd className="font-medium">{description}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Recojo</dt>
                <dd className="font-medium">{pickup?.text}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Destino</dt>
                <dd className="font-medium">{dropoff?.text}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Cuándo</dt>
                <dd className="font-medium">
                  {whenType === 'ahora' ? 'Ahora' : scheduledAt}
                </dd>
              </div>
              {farePreview && (
                <div className="rounded-xl bg-[rgba(var(--brand-primary-rgb),0.08)] p-3">
                  <div className="text-[var(--text-secondary)]">
                    ~{farePreview.km.toFixed(1)} km
                  </div>
                  <div className="text-xl font-bold text-[var(--brand-blue)]">
                    {formatFareSoles(farePreview.fare)}
                    {tip ? ` + propina S/ ${tip}` : ''}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Pagas al motorizado en efectivo o Yape. Sin comisión de Buscadis.
                  </p>
                </div>
              )}
            </dl>
            {!user && (
              <p className="text-sm text-amber-600">
                Para publicar necesitas iniciar sesión.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}

        <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
          <div className="mx-auto flex max-w-lg gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-full border border-[var(--border-color)] px-5 py-3 text-sm font-semibold"
              >
                Atrás
              </button>
            )}
            {step !== 'resumen' ? (
              <button
                type="button"
                disabled={!canNext()}
                onClick={goNext}
                className="flex-1 rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="flex-1 rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {submitting
                  ? 'Publicando…'
                  : user
                    ? 'Pedir envío'
                    : 'Iniciar sesión y pedir'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
