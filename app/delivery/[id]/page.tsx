'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import {
  MOTO_CATEGORY_LABELS,
  STATUS_LABELS,
  formatFareSoles,
  enviosAuthFetch,
  type MotoRequest,
  type MotoCategory,
  type MotoRequestStatus,
} from '@/lib/envios';
import { IconArrowLeft, IconStar, IconMessages, IconLocation } from '@/components/Icons';

interface DetailPayload {
  request: MotoRequest;
  rider: {
    id: string;
    user_id?: string;
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
  conversationId: string | null;
  role: 'requester' | 'rider' | 'other';
}

export default function DeliveryDetallePage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const { openChat } = useUI();
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await enviosAuthFetch(`/api/envios/requests/${id}`);
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
    const t = setInterval(() => void load(), 10000);
    return () => clearInterval(t);
  }, [user, load]);

  const patch = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await enviosAuthFetch(`/api/envios/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      if (json.conversationId && action === 'accept') {
        // rider just accepted — chat ready
      }
      await load();
      return json;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no permite ubicación');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await patch('share_location', {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setBusy(false);
      },
      () => {
        setError('No pudimos obtener tu ubicación');
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const openDeliveryChat = () => {
    if (data?.conversationId) {
      openChat(data.conversationId);
    }
  };

  const submitRating = async () => {
    setBusy(true);
    try {
      const res = await enviosAuthFetch(`/api/envios/requests/${id}/rate`, {
        method: 'POST',
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
          <p className="text-[var(--text-secondary)]">Inicia sesión para ver este pedido.</p>
          <Link
            href={`/login?redirect=/delivery/${id}`}
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
  const canCancel =
    status && ['pendiente', 'aceptado', 'recogido'].includes(status) && data?.role !== 'other';
  const activeTrip = status && ['aceptado', 'recogido'].includes(status);

  const otherLat =
    data?.role === 'requester'
      ? req?.rider_lat
      : req?.requester_lat;
  const otherLng =
    data?.role === 'requester'
      ? req?.rider_lng
      : req?.requester_lng;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">
        <button
          type="button"
          onClick={() => router.push('/delivery')}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <IconArrowLeft size={16} /> Delivery
        </button>

        {loading && <p className="text-sm text-[var(--text-secondary)]">Cargando…</p>}
        {error && (
          <p className="mb-3 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}

        {req && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border-color)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                {STATUS_LABELS[status!]}
              </div>
              <h1 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                {MOTO_CATEGORY_LABELS[req.category as MotoCategory] || req.category}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-primary)]">{req.description}</p>
              {req.cancel_reason && status === 'cancelado' && (
                <p className="mt-2 text-sm text-red-600">Motivo: {req.cancel_reason}</p>
              )}
            </div>

            <div className="space-y-2 rounded-2xl border border-[var(--border-color)] p-4 text-sm">
              <div>
                <span className="text-[var(--text-secondary)]">Desde</span>
                <p className="font-medium">{req.pickup_text}</p>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Hasta</span>
                <p className="font-medium">{req.dropoff_text}</p>
              </div>
              <div className="flex justify-between border-t border-[var(--border-color)] pt-2">
                <span>~{Number(req.distance_km).toFixed(1)} km</span>
                <span className="font-bold text-[var(--brand-blue)]">
                  {formatFareSoles(Number(req.fare_estimate))}
                </span>
              </div>
            </div>

            {data?.rider && (
              <div className="rounded-2xl border border-[var(--border-color)] p-4">
                <p className="text-xs text-[var(--text-secondary)]">Motorizado</p>
                <p className="font-semibold">{data.rider.display_name || 'Motorizado'}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {data.rider.placa && `Placa ${data.rider.placa} · `}★{' '}
                  {Number(data.rider.rating_avg).toFixed(1)}
                </p>
              </div>
            )}

            {activeTrip && otherLat != null && otherLng != null && (
              <a
                href={`https://www.google.com/maps?q=${otherLat},${otherLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] p-4 text-sm font-medium text-[var(--brand-blue)]"
              >
                <IconLocation size={16} />
                Ver última ubicación compartida
              </a>
            )}

            {/* Acciones principales */}
            <div className="flex flex-col gap-2">
              {data?.conversationId && activeTrip && (
                <button
                  type="button"
                  onClick={openDeliveryChat}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white"
                >
                  <IconMessages size={16} color="#fff" />
                  Chatear en Buscadis
                </button>
              )}

              {activeTrip && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={shareLocation}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-color)] py-3 text-sm font-semibold"
                >
                  <IconLocation size={16} />
                  Compartir mi ubicación ahora
                </button>
              )}

              {data?.role === 'rider' && status === 'aceptado' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void patch('recogido')}
                  className="w-full rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white"
                >
                  Marcar recogido
                </button>
              )}
              {data?.role === 'rider' && status === 'recogido' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void patch('entregado')}
                  className="w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white"
                >
                  Marcar entregado
                </button>
              )}
            </div>

            {canCancel && !cancelOpen && (
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="w-full rounded-full border border-red-300 py-3 text-sm font-semibold text-red-600"
              >
                Cancelar pedido
              </button>
            )}

            {cancelOpen && (
              <div className="space-y-2 rounded-2xl border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-600">¿Por qué cancelas?</p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  placeholder="Ej: se demoró, cambio de planes, percance…"
                  className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelOpen(false)}
                    className="flex-1 rounded-full border border-[var(--border-color)] py-2.5 text-sm"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      await patch('cancel', {
                        cancel_reason: cancelReason.trim() || undefined,
                      });
                      setCancelOpen(false);
                    }}
                    className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white"
                  >
                    Confirmar cancelación
                  </button>
                </div>
              </div>
            )}

            {data?.role === 'requester' && status === 'entregado' && !data.myRating && (
              <div className="space-y-3 rounded-2xl border border-[var(--border-color)] p-4">
                <p className="font-semibold">Califica al motorizado</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setStars(n)}>
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
                <Link href="/" className="block text-center text-sm text-[var(--brand-blue)]">
                  ¿Buscas algo más en Buscadis?
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
