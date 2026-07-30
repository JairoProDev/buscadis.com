'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { supabase } from '@/lib/supabase';
import {
  MOTO_CATEGORY_LABELS,
  formatFareSoles,
  type MotoCategory,
  type MotoRequest,
  type MotoRider,
} from '@/lib/envios';
import { enviosAuthFetch } from '@/lib/envios/auth-fetch';
import { IconArrowLeft } from '@/components/Icons';

const RIDER_ONBOARDING_KEY = 'buscadis:delivery-rider-onboarding-v1';

interface RiderStats {
  summary: {
    delivered: number;
    earningsEstimate: number;
    km: number;
  };
  demandHints: {
    tip: string;
    topZonas: Array<{ zona: string; count: number }>;
  };
}

export default function ConductorFeedPage() {
  const { user } = useAuth();
  const { openChat } = useUI();
  const [rider, setRider] = useState<MotoRider | null>(null);
  const [requests, setRequests] = useState<MotoRequest[]>([]);
  const [active, setActive] = useState<MotoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState<RiderStats | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(RIDER_ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const me = await enviosAuthFetch('/api/envios/rider');
      const meData = await me.json();
      setRider(meData.rider || null);

      if (meData.rider?.estado === 'aprobado') {
        const [avail, mine, st] = await Promise.all([
          enviosAuthFetch('/api/envios/requests?scope=available'),
          enviosAuthFetch('/api/envios/requests?scope=mine'),
          enviosAuthFetch('/api/envios/rider/stats'),
        ]);
        const availData = await avail.json();
        const mineData = await mine.json();
        setRequests(availData.requests || []);
        const mineList = (mineData.requests || []) as MotoRequest[];
        setActive(
          mineList.filter(
            (r) =>
              r.rider_id === meData.rider.id &&
              ['aceptado', 'recogido'].includes(r.status)
          )
        );
        if (st.ok) {
          const stData = await st.json();
          setStats(stData);
        }
      }
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [user, load]);

  useEffect(() => {
    if (!rider || rider.estado !== 'aprobado' || !supabase) return;

    const client = supabase;
    const channel = client
      .channel('moto-requests-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moto_requests' },
        () => {
          void load();
        }
      )
      .subscribe();

    const poll = setInterval(() => void load(), 12000);
    return () => {
      client.removeChannel(channel);
      clearInterval(poll);
    };
  }, [rider, load]);

  const toggleOnline = async () => {
    if (!rider) return;
    setBusyId('online');
    try {
      const res = await enviosAuthFetch('/api/envios/rider', {
        method: 'PATCH',
        body: JSON.stringify({ online: !rider.online }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRider(data.rider);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  };

  const act = async (id: string, action: string) => {
    setBusyId(id);
    try {
      const res = await enviosAuthFetch(`/api/envios/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 || data.code === 'taken') {
          setError(
            data.error ||
              'Otro motorizado ya tomó este pedido. Mira los disponibles abajo.'
          );
          await load();
          return;
        }
        throw new Error(data.error || 'Error');
      }
      if (action === 'accept' && data.conversationId) {
        openChat(data.conversationId);
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-10 text-center">
          <p>Inicia sesión como motorizado.</p>
          <Link href="/login?redirect=/delivery/llevar" className="text-[var(--brand-blue)]">
            Login
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header />
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">
        <Link
          href="/delivery"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <IconArrowLeft size={16} /> Delivery
        </Link>

        <h1 className="text-xl font-bold">Llevar</h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Solo pedidos reales — sin spam del grupo
        </p>

        {showOnboarding && (
          <div className="mt-4 rounded-3xl border border-[var(--brand-blue)]/25 bg-[rgba(var(--brand-primary-rgb),0.08)] p-4">
            <p className="text-sm font-bold">Tu reputación ya no se pierde en el chat</p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
              <li>· Activa Online en picos 7–10 y 16–20.</li>
              <li>· Acepta → coordina por el chat de la app (suma a tu perfil).</li>
              <li>· Sin comisión. Cada entrega bien hecha queda para siempre.</li>
            </ul>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(RIDER_ONBOARDING_KEY, '1');
                setShowOnboarding(false);
              }}
              className="mt-3 w-full rounded-full bg-[var(--brand-blue)] py-2.5 text-sm font-semibold text-white"
            >
              Empezar
            </button>
          </div>
        )}

        {loading && <p className="mt-4 text-sm text-[var(--text-secondary)]">Cargando…</p>}

        {!loading && !rider && (
          <div className="mt-6 rounded-2xl border border-[var(--border-color)] p-5 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Aún no estás registrado. Completa el filtro de seguridad (DNI, licencia, SOAT,
              antecedentes) para recibir envíos.
            </p>
            <Link
              href="/delivery/llevar/registro"
              className="mt-4 inline-block rounded-full bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white"
            >
              Quiero ser motorizado
            </Link>
          </div>
        )}

        {!loading && rider && rider.estado === 'borrador' && (
          <div className="mt-6 space-y-3">
            <p className="text-sm">Registro incompleto. Continúa donde lo dejaste.</p>
            <Link
              href="/delivery/llevar/registro"
              className="inline-block rounded-full bg-[var(--brand-blue)] px-5 py-3 text-sm font-semibold text-white"
            >
              Continuar registro
            </Link>
          </div>
        )}

        {!loading && rider && rider.estado === 'pendiente' && (
          <div className="mt-6 rounded-2xl bg-[rgba(var(--brand-yellow-rgb),0.15)] p-4 text-sm">
            <p className="font-semibold">En revisión</p>
            <p className="mt-1 text-[var(--text-secondary)]">
              Estamos verificando tus documentos. Te avisamos por notificación cuando estés
              aprobado.
            </p>
          </div>
        )}

        {!loading && rider && rider.estado === 'rechazado' && (
          <div className="mt-6 rounded-2xl border border-red-200 p-4 text-sm">
            <p className="font-semibold text-red-600">No aprobado</p>
            <p className="mt-1">{rider.admin_note || 'Corrige documentos y vuelve a enviar.'}</p>
            <Link
              href="/delivery/llevar/registro"
              className="mt-3 inline-block text-[var(--brand-blue)]"
            >
              Actualizar documentos
            </Link>
          </div>
        )}

        {!loading && rider && rider.estado === 'aprobado' && (
          <>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--border-color)] p-4">
              <div>
                <p className="font-semibold">{rider.display_name}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  ★ {Number(rider.rating_avg).toFixed(1)} · {rider.placa}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === 'online'}
                onClick={() => void toggleOnline()}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
                  rider.online ? 'bg-emerald-500' : 'bg-[var(--text-secondary)]'
                }`}
              >
                {rider.online ? 'Online' : 'Offline'}
              </button>
            </div>

            {stats && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ['Entregas', stats.summary.delivered],
                  ['Est. S/', stats.summary.earningsEstimate],
                  ['Km', stats.summary.km],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl border border-[var(--border-color)] p-2 text-center"
                  >
                    <div className="text-lg font-bold text-[var(--brand-blue)]">{value}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {stats?.demandHints?.tip && (
              <p className="mt-3 rounded-xl bg-[rgba(var(--brand-primary-rgb),0.08)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                {stats.demandHints.tip}
              </p>
            )}

            {active.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  En curso
                </h2>
                <div className="space-y-3">
                  {active.map((r) => (
                    <RequestCard
                      key={r.id}
                      request={r}
                      busy={busyId === r.id}
                      mode="active"
                      onAction={(a) => void act(r.id, a)}
                      onOpenChat={() => {
                        if (r.conversation_id) openChat(r.conversation_id);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Disponibles
              </h2>
              {!rider.online && (
                <p className="mb-3 text-xs text-amber-600">
                  Ponte online para que te notifiquen nuevos envíos primero.
                </p>
              )}
              {requests.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No hay solicitudes pendientes en tus zonas ahora.
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => (
                    <RequestCard
                      key={r.id}
                      request={r}
                      busy={busyId === r.id}
                      mode="available"
                      onAction={(a) => void act(r.id, a)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </main>
    </div>
  );
}

function RequestCard({
  request,
  busy,
  mode,
  onAction,
  onOpenChat,
}: {
  request: MotoRequest;
  busy: boolean;
  mode: 'available' | 'active';
  onAction: (action: string) => void;
  onOpenChat?: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--border-color)] p-4">
      <div className="text-xs font-semibold text-[var(--brand-blue)]">
        {MOTO_CATEGORY_LABELS[request.category as MotoCategory]}
      </div>
      <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
        {request.description}
      </p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {request.pickup_text}
        <span className="mx-1">→</span>
        {request.dropoff_text}
      </p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span>~{Number(request.distance_km).toFixed(1)} km</span>
        <span className="font-bold text-[var(--brand-blue)]">
          {formatFareSoles(Number(request.fare_agreed ?? request.fare_estimate))}
        </span>
      </div>
      {request.when_type === 'programado' && request.scheduled_at && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Programado: {new Date(request.scheduled_at).toLocaleString('es-PE')}
        </p>
      )}
      {request.budget_estimate != null && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Presupuesto compra: {formatFareSoles(Number(request.budget_estimate))}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {mode === 'available' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction('accept')}
            className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Aceptar
          </button>
        )}
        {mode === 'active' && onOpenChat && (
          <button
            type="button"
            onClick={onOpenChat}
            className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white"
          >
            Chat
          </button>
        )}
        {mode === 'active' && request.status === 'aceptado' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction('recogido')}
            className="rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-semibold"
          >
            Marcar recogido
          </button>
        )}
        {mode === 'active' && request.status === 'recogido' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction('entregado')}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Marcar entregado
          </button>
        )}
        {mode === 'active' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction('cancel')}
            className="rounded-full px-3 py-2 text-sm text-red-600"
          >
            Cancelar
          </button>
        )}
        <Link
          href={`/delivery/${request.id}`}
          className="rounded-full px-3 py-2 text-sm text-[var(--text-secondary)]"
        >
          Detalle
        </Link>
      </div>
    </article>
  );
}
