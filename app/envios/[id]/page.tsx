'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import {
  MOTO_CATEGORY_LABELS,
  STATUS_LABELS,
  formatFareSoles,
  type MotoRequest,
  type MotoCategory,
  type MotoRequestStatus,
} from '@/lib/envios';
import { IconArrowLeft, IconStar, IconWhatsapp } from '@/components/Icons';

interface DetailPayload {
  request: MotoRequest;
  rider: {
    id: string;
    display_name: string | null;
    telefono_whatsapp: string | null;
    placa: string | null;
    foto_perfil_url: string | null;
    rating_avg: number;
    rating_count: number;
  } | null;
  requester: {
    id: string;
    nombre?: string;
    telefono?: string;
  } | null;
  myRating: { stars: number; comment: string | null } | null;
  role: 'requester' | 'rider' | 'other';
}

export default function EnvioDetallePage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/envios/requests/${id}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setData(json);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
    const t = setInterval(() => void load(), 8000);
    return () => clearInterval(t);
  }, [user, load]);

  const patch = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/envios/requests/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const submitRating = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/envios/requests/${id}/rate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-10 text-center">
          <p className="text-[var(--text-secondary)]">Inicia sesión para ver este envío.</p>
          <Link
            href={`/login?redirect=/envios/${id}`}
            className="mt-4 inline-block text-[var(--brand-blue)]"
          >
            Ir a login
          </Link>
        </main>
      </div>
    );
  }

  const req = data?.request;
  const status = req?.status as MotoRequestStatus | undefined;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">
        <button
          type="button"
          onClick={() => router.push('/envios')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <IconArrowLeft size={16} /> Envíos
        </button>

        {loading && <p className="text-sm text-[var(--text-secondary)]">Cargando…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {req && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border-color)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                {STATUS_LABELS[status!]}
              </div>
              <h1 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                {MOTO_CATEGORY_LABELS[req.category as MotoCategory]}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-primary)]">{req.description}</p>
              {req.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={req.photo_url}
                  alt=""
                  className="mt-3 max-h-40 rounded-xl object-cover"
                />
              )}
            </div>

            <div className="rounded-2xl border border-[var(--border-color)] p-4 text-sm space-y-2">
              <div>
                <span className="text-[var(--text-secondary)]">Recojo</span>
                <p className="font-medium">{req.pickup_text}</p>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Destino</span>
                <p className="font-medium">{req.dropoff_text}</p>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--border-color)]">
                <span>~{Number(req.distance_km).toFixed(1)} km</span>
                <span className="font-bold text-[var(--brand-blue)]">
                  {formatFareSoles(Number(req.fare_estimate))}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Pago en efectivo o Yape al motorizado
              </p>
            </div>

            {data?.rider && (
              <div className="rounded-2xl border border-[var(--border-color)] p-4">
                <p className="text-xs text-[var(--text-secondary)]">Motorizado</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{data.rider.display_name || 'Motorizado'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {data.rider.placa && `Placa ${data.rider.placa} · `}
                      ★ {Number(data.rider.rating_avg).toFixed(1)} (
                      {data.rider.rating_count})
                    </p>
                  </div>
                  {data.rider.telefono_whatsapp && (
                    <a
                      href={`https://wa.me/${data.rider.telefono_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hola, soy de Buscadis Envíos (${req.id.slice(0, 8)}). ¿Coordinamos el recojo?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white"
                    >
                      <IconWhatsapp size={14} color="#fff" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            {data?.role === 'requester' && status === 'pendiente' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void patch('cancel', { cancel_reason: 'Cancelado por usuario' })}
                className="w-full rounded-full border border-red-300 py-3 text-sm font-semibold text-red-600"
              >
                Cancelar solicitud
              </button>
            )}

            {data?.role === 'requester' &&
              status === 'entregado' &&
              !data.myRating && (
                <div className="rounded-2xl border border-[var(--border-color)] p-4 space-y-3">
                  <p className="font-semibold">Califica al motorizado</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setStars(n)}
                        aria-label={`${n} estrellas`}
                      >
                        <IconStar
                          size={28}
                          color={n <= stars ? 'var(--brand-yellow)' : 'var(--border-color)'}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comentario opcional"
                    rows={2}
                    className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submitRating()}
                    className="w-full rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white"
                  >
                    Enviar calificación
                  </button>
                  <Link
                    href="/"
                    className="block text-center text-sm text-[var(--brand-blue)]"
                  >
                    ¿Buscas algo más en Buscadis?
                  </Link>
                </div>
              )}

            {data?.myRating && (
              <p className="text-sm text-[var(--text-secondary)]">
                Ya calificaste con {data.myRating.stars} ★
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
