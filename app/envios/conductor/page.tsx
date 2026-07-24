'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  MOTO_CATEGORY_LABELS,
  formatFareSoles,
  type MotoCategory,
  type MotoRequest,
  type MotoRider,
} from '@/lib/envios';
import { IconArrowLeft } from '@/components/Icons';

export default function ConductorFeedPage() {
  const { user } = useAuth();
  const [rider, setRider] = useState<MotoRider | null>(null);
  const [requests, setRequests] = useState<MotoRequest[]>([]);
  const [active, setActive] = useState<MotoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requesterPhones, setRequesterPhones] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const me = await fetch('/api/envios/rider', { credentials: 'include' });
      const meData = await me.json();
      setRider(meData.rider || null);

      if (meData.rider?.estado === 'aprobado') {
        const [avail, mine] = await Promise.all([
          fetch('/api/envios/requests?scope=available', { credentials: 'include' }),
          fetch('/api/envios/requests?scope=mine', { credentials: 'include' }),
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

  // Realtime nuevas solicitudes pendientes
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
      const res = await fetch('/api/envios/rider', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/envios/requests/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  };

  const loadPhone = async (requestId: string) => {
    if (requesterPhones[requestId]) return;
    const res = await fetch(`/api/envios/requests/${requestId}`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (data.requester?.telefono) {
      setRequesterPhones((p) => ({ ...p, [requestId]: data.requester.telefono }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-10 text-center">
          <p>Inicia sesión como motorizado.</p>
          <Link href="/login?redirect=/envios/conductor" className="text-[var(--brand-blue)]">
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
          href="/envios"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <IconArrowLeft size={16} /> Envíos
        </Link>

        <h1 className="text-xl font-bold">Panel motorizado</h1>

        {loading && <p className="mt-4 text-sm text-[var(--text-secondary)]">Cargando…</p>}

        {!loading && !rider && (
          <div className="mt-6 rounded-2xl border border-[var(--border-color)] p-5 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Aún no estás registrado. Completa el filtro de seguridad (DNI, licencia, SOAT,
              antecedentes) para recibir envíos.
            </p>
            <Link
              href="/envios/conductor/registro"
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
              href="/envios/conductor/registro"
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
              href="/envios/conductor/registro"
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
                      phone={requesterPhones[r.id]}
                      onFocus={() => void loadPhone(r.id)}
                      onAction={(a) => void act(r.id, a)}
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
                  Ponte online para que te notifiquen nuevos envíos.
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
  phone,
  onFocus,
  onAction,
}: {
  request: MotoRequest;
  busy: boolean;
  mode: 'available' | 'active';
  phone?: string;
  onFocus?: () => void;
  onAction: (action: string) => void;
}) {
  return (
    <article
      className="rounded-2xl border border-[var(--border-color)] p-4"
      onMouseEnter={onFocus}
      onFocus={onFocus}
    >
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
          {formatFareSoles(Number(request.fare_estimate))}
        </span>
      </div>
      {request.when_type === 'programado' && request.scheduled_at && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Programado: {new Date(request.scheduled_at).toLocaleString('es-PE')}
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
        {mode === 'active' && request.status === 'aceptado' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction('recogido')}
            className="rounded-full bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white"
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
        {mode === 'active' && phone && (
          <a
            href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
              'Hola, soy el motorizado de Buscadis Envíos. Voy al recojo.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-semibold"
          >
            WhatsApp
          </a>
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
          href={`/envios/${request.id}`}
          className="rounded-full px-3 py-2 text-sm text-[var(--text-secondary)]"
        >
          Detalle
        </Link>
      </div>
    </article>
  );
}
