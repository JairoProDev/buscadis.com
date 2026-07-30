'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import {
  MOTO_CATEGORY_LABELS,
  STATUS_LABELS,
  QUICK_REPLIES_RIDER,
  QUICK_REPLIES_REQUESTER,
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
    foto_moto_url: string | null;
    rating_avg: number;
    rating_count: number;
    verified?: boolean;
  } | null;
  requester: {
    id: string;
    nombre?: string;
    telefono?: string | null;
    avatar_url?: string | null;
    completed_count?: number;
  } | null;
  myRating: { stars: number; comment: string | null } | null;
  conversationId: string | null;
  viewers?: number;
  etaMinutes?: number | null;
  phoneShared?: boolean;
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
  const [confirmAction, setConfirmAction] = useState<'recogido' | 'entregado' | null>(null);
  const [fareEdit, setFareEdit] = useState('');
  const [tipEdit, setTipEdit] = useState('');
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimReason, setClaimReason] = useState('otro');
  const [claimDetails, setClaimDetails] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [phoneConfirm, setPhoneConfirm] = useState(false);
  const trackingRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await enviosAuthFetch(`/api/envios/requests/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setData(json);
      setError(null);
      if (json.request?.fare_agreed != null) {
        setFareEdit(String(json.request.fare_agreed));
      } else if (json.request?.fare_estimate != null) {
        setFareEdit(String(json.request.fare_estimate));
      }
      if (json.request?.tip_amount != null) {
        setTipEdit(String(json.request.tip_amount));
      }
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

  // Auto-open chat once when conversation appears
  useEffect(() => {
    if (data?.conversationId && data.role !== 'other') {
      const key = `buscadis:delivery-chat-opened:${id}`;
      if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        openChat(data.conversationId);
      }
    }
  }, [data?.conversationId, data?.role, id, openChat]);

  // Live tracking heartbeat for assigned rider
  useEffect(() => {
    if (data?.role !== 'rider') return;
    const status = data.request?.status;
    if (!status || !['aceptado', 'recogido'].includes(status)) return;
    if (!navigator.geolocation) return;

    const tick = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void enviosAuthFetch(`/api/envios/requests/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              action: 'heartbeat_location',
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });
        },
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
      );
    };
    tick();
    trackingRef.current = window.setInterval(tick, 25000);
    return () => {
      if (trackingRef.current) window.clearInterval(trackingRef.current);
    };
  }, [data?.role, data?.request?.status, id]);

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
      if (json.conversationId && (action === 'accept' || action === 'quick_reply')) {
        openChat(json.conversationId);
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
    if (data?.conversationId) openChat(data.conversationId);
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

  const saveFavorite = async () => {
    setBusy(true);
    try {
      const res = await enviosAuthFetch('/api/envios/favorites', {
        method: 'POST',
        body: JSON.stringify({ from_request_id: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setError(null);
      alert('Ruta guardada — la próxima vez la pides en un toque desde Pedir.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const ensureShare = async () => {
    const json = await patch('ensure_share_token');
    if (json?.shareUrl) {
      const full = `${window.location.origin}${json.shareUrl}`;
      setShareUrl(full);
      try {
        await navigator.clipboard.writeText(full);
      } catch {
        /* ignore */
      }
    }
  };

  const submitClaim = async () => {
    setBusy(true);
    try {
      const res = await enviosAuthFetch('/api/envios/claims', {
        method: 'POST',
        body: JSON.stringify({
          request_id: id,
          reason: claimReason,
          details: claimDetails,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setClaimOpen(false);
      setError(null);
      alert('Reclamo registrado. El equipo lo revisará con el historial del pedido.');
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
  const waiting = status === 'pendiente';
  const quickReplies =
    data?.role === 'rider' ? QUICK_REPLIES_RIDER : QUICK_REPLIES_REQUESTER;

  const otherLat =
    data?.role === 'requester' ? req?.rider_lat : req?.requester_lat;
  const otherLng =
    data?.role === 'requester' ? req?.rider_lng : req?.requester_lng;

  const elapsedMin = req?.created_at
    ? Math.max(0, Math.round((Date.now() - new Date(req.created_at).getTime()) / 60000))
    : 0;

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
            {/* Chat hero */}
            {data?.conversationId && activeTrip && (
              <section className="overflow-hidden rounded-3xl border border-[var(--brand-blue)]/30 bg-[rgba(var(--brand-primary-rgb),0.08)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                  Coordina aquí — más seguro
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {data.role === 'requester'
                    ? 'Tu número no se publica. Habla por el chat de Buscadis.'
                    : 'Cada mensaje aquí suma a tu reputación permanente.'}
                </p>
                <button
                  type="button"
                  onClick={openDeliveryChat}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-blue)] py-3.5 text-sm font-bold text-white"
                >
                  <IconMessages size={16} color="#fff" />
                  Abrir chat del pedido
                </button>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickReplies.map((msg) => (
                    <button
                      key={msg}
                      type="button"
                      disabled={busy}
                      onClick={() => void patch('quick_reply', { message: msg })}
                      className="rounded-full border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="rounded-2xl border border-[var(--border-color)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                {STATUS_LABELS[status!]}
                {data?.etaMinutes != null && activeTrip && (
                  <span className="ml-2 font-normal normal-case text-[var(--text-secondary)]">
                    · ETA ~{data.etaMinutes} min
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                {MOTO_CATEGORY_LABELS[req.category as MotoCategory] || req.category}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-primary)]">{req.description}</p>
              {req.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={req.photo_url}
                  alt="Foto del envío"
                  className="mt-3 max-h-48 w-full rounded-xl object-cover"
                />
              )}
              {req.cancel_reason && status === 'cancelado' && (
                <p className="mt-2 text-sm text-red-600">Motivo: {req.cancel_reason}</p>
              )}
            </div>

            {waiting && (
              <div className="rounded-2xl border border-dashed border-[var(--brand-blue)]/40 bg-[rgba(var(--brand-primary-rgb),0.06)] p-4 text-sm">
                <p className="font-semibold text-[var(--text-primary)]">
                  {(data?.viewers || 0) > 0
                    ? `${data?.viewers} motorizado${(data?.viewers || 0) === 1 ? '' : 's'} viendo tu pedido`
                    : 'Buscando motorizados online en tu zona…'}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Publicado hace {elapsedMin} min. Tu número no aparece en ningún grupo.
                </p>
                {elapsedMin >= 8 && (
                  <p className="mt-2 text-xs text-amber-700">
                    Si tarda un poco, los motorizados suelen activarse en picos 7–10h y 16–20h.
                  </p>
                )}
              </div>
            )}

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
                  {formatFareSoles(Number(req.fare_agreed ?? req.fare_estimate))}
                  {req.tip_amount ? ` + tip ${formatFareSoles(Number(req.tip_amount))}` : ''}
                </span>
              </div>
              {req.budget_estimate != null && (
                <p className="text-xs text-[var(--text-secondary)]">
                  Presupuesto mandado: {formatFareSoles(Number(req.budget_estimate))}
                </p>
              )}
            </div>

            {/* Perfil verificado */}
            {data?.rider && (
              <div className="flex gap-3 rounded-2xl border border-[var(--border-color)] p-4">
                {data.rider.foto_perfil_url || data.rider.foto_moto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.rider.foto_perfil_url || data.rider.foto_moto_url || ''}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--brand-primary-rgb),0.12)] text-lg font-bold text-[var(--brand-blue)]">
                    {(data.rider.display_name || 'M').slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{data.rider.display_name || 'Motorizado'}</p>
                    {data.rider.verified && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Verificado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {data.rider.placa && `Placa ${data.rider.placa} · `}★{' '}
                    {Number(data.rider.rating_avg).toFixed(1)} ({data.rider.rating_count})
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    Documentos revisados (DNI, licencia, SOAT, antecedentes).
                  </p>
                </div>
              </div>
            )}

            {data?.role === 'rider' && data.requester && (
              <div className="rounded-2xl border border-[var(--border-color)] p-4">
                <p className="text-xs text-[var(--text-secondary)]">Quien pidió</p>
                <p className="font-semibold">{data.requester.nombre || 'Cliente'}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {data.requester.completed_count || 0} envíos completados en Buscadis
                </p>
              </div>
            )}

            {/* Mapa / ubicación */}
            {activeTrip && otherLat != null && otherLng != null && (
              <a
                href={`https://www.google.com/maps?q=${otherLat},${otherLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] p-4 text-sm font-medium text-[var(--brand-blue)]"
              >
                <IconLocation size={16} />
                Ver última ubicación en el mapa
              </a>
            )}

            {/* Tarifa flexible */}
            {activeTrip && (
              <div className="space-y-2 rounded-2xl border border-[var(--border-color)] p-4">
                <p className="text-sm font-semibold">Tarifa acordada (efectivo / Yape)</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={fareEdit}
                    onChange={(e) => setFareEdit(e.target.value)}
                    className="flex-1 rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void patch('set_fare_agreed', { fare_agreed: Number(fareEdit) })
                    }
                    className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Guardar
                  </button>
                </div>
                {data?.role === 'requester' && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={tipEdit}
                      onChange={(e) => setTipEdit(e.target.value)}
                      placeholder="Propina opcional"
                      className="flex-1 rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void patch('set_tip', { tip_amount: Number(tipEdit) })}
                      className="rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-semibold"
                    >
                      Tip
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
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
                  onClick={() => setConfirmAction('recogido')}
                  className="w-full rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white"
                >
                  Marcar recogido
                </button>
              )}
              {data?.role === 'rider' && status === 'recogido' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmAction('entregado')}
                  className="w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white"
                >
                  Marcar entregado
                </button>
              )}

              {confirmAction && (
                <div className="rounded-2xl border border-[var(--border-color)] p-4 text-sm">
                  <p className="font-semibold">
                    ¿Confirmas {confirmAction === 'recogido' ? 'el recojo' : 'la entrega'}?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      className="flex-1 rounded-full border border-[var(--border-color)] py-2.5"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        await patch(confirmAction);
                        setConfirmAction(null);
                      }}
                      className="flex-1 rounded-full bg-[var(--brand-blue)] py-2.5 font-semibold text-white"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              {/* Compartir número — secundario, positivo */}
              {activeTrip && !data?.phoneShared && (
                <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-3 text-xs text-[var(--text-secondary)]">
                  {phoneConfirm ? (
                    <div className="space-y-2">
                      <p>
                        Si ambos quieren, pueden verse el número. El chat de la app sigue siendo
                        el mejor lugar para dejar rastro y reputación.
                      </p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void patch('share_phone')}
                        className="w-full rounded-full border border-[var(--border-color)] py-2.5 text-sm font-semibold text-[var(--text-primary)]"
                      >
                        Compartir números en este pedido
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneConfirm(false)}
                        className="w-full py-1 text-[var(--text-secondary)]"
                      >
                        Mejor seguimos en el chat
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPhoneConfirm(true)}
                      className="w-full text-left underline-offset-2 hover:underline"
                    >
                      ¿Prefieren hablar por WhatsApp al final? Tocá aquí
                    </button>
                  )}
                </div>
              )}

              {data?.phoneShared && data.rider?.telefono_whatsapp && data.role === 'requester' && (
                <a
                  href={`https://wa.me/${data.rider.telefono_whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[var(--border-color)] py-3 text-center text-sm font-semibold"
                >
                  Abrir WhatsApp del motorizado
                </a>
              )}

              {activeTrip && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void ensureShare()}
                  className="w-full rounded-full border border-[var(--border-color)] py-3 text-sm font-semibold"
                >
                  Compartir seguimiento con un contacto
                </button>
              )}
              {shareUrl && (
                <p className="break-all text-xs text-[var(--text-secondary)]">
                  Link copiado: {shareUrl}
                </p>
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
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveFavorite()}
                  className="w-full rounded-full border border-[var(--border-color)] py-2.5 text-sm font-semibold"
                >
                  Guardar esta ruta
                </button>
                <Link href="/" className="block text-center text-sm text-[var(--brand-blue)]">
                  ¿Buscas algo más en Buscadis?
                </Link>
              </div>
            )}

            {(status === 'entregado' || status === 'cancelado' || activeTrip) &&
              data?.role !== 'other' && (
                <div className="pt-2">
                  {!claimOpen ? (
                    <button
                      type="button"
                      onClick={() => setClaimOpen(true)}
                      className="text-xs text-[var(--text-secondary)] underline-offset-2 hover:underline"
                    >
                      ¿Algo salió mal? Abrir reclamo con historial
                    </button>
                  ) : (
                    <div className="space-y-2 rounded-2xl border border-[var(--border-color)] p-4">
                      <p className="text-sm font-semibold">Reclamo</p>
                      <select
                        value={claimReason}
                        onChange={(e) => setClaimReason(e.target.value)}
                        className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm"
                      >
                        <option value="no_llego">No llegó / demora</option>
                        <option value="cobro_incorrecto">Cobro incorrecto</option>
                        <option value="trato">Trato</option>
                        <option value="dano_paquete">Daño al paquete</option>
                        <option value="seguridad">Seguridad</option>
                        <option value="otro">Otro</option>
                      </select>
                      <textarea
                        value={claimDetails}
                        onChange={(e) => setClaimDetails(e.target.value)}
                        rows={3}
                        placeholder="Cuéntanos qué pasó…"
                        className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setClaimOpen(false)}
                          className="flex-1 rounded-full border py-2 text-sm"
                        >
                          Cerrar
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void submitClaim()}
                          className="flex-1 rounded-full bg-[var(--brand-blue)] py-2 text-sm font-semibold text-white"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
