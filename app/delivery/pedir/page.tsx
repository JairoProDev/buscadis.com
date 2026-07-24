'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import DeliveryPointField, {
  type DeliveryMapPoint,
} from '@/components/envios/DeliveryPointField';
import { useAuth } from '@/hooks/useAuth';
import {
  estimateDistanceKm,
  estimateFare,
  formatFareSoles,
  enviosAuthFetch,
  DELIVERY_ENVIO_OPTIONS,
  type MotoCategory,
} from '@/lib/envios';
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconUser,
  IconBox,
} from '@/components/Icons';

type FechaPreset = 'hoy' | 'manana' | 'otra';
type EnvioTipo = MotoCategory;

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultTimeSoon(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 15);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DeliveryPedirPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [nombre, setNombre] = useState('');
  const [desde, setDesde] = useState<DeliveryMapPoint | null>(null);
  const [hasta, setHasta] = useState<DeliveryMapPoint | null>(null);
  const [fechaPreset, setFechaPreset] = useState<FechaPreset>('hoy');
  const [fechaOtra, setFechaOtra] = useState('');
  const [hora, setHora] = useState(defaultTimeSoon);
  const [envioTipo, setEnvioTipo] = useState<EnvioTipo>('paquete');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    if (profile?.nombre && !nombre) setNombre(profile.nombre);
  }, [profile?.nombre, nombre]);

  useEffect(() => {
    if (draftRestored || typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('buscadis:delivery-draft');
      if (!raw) {
        setDraftRestored(true);
        return;
      }
      const d = JSON.parse(raw);
      if (d.nombre) setNombre(d.nombre);
      if (d.desde) setDesde(d.desde);
      if (d.hasta) setHasta(d.hasta);
      if (d.hora) setHora(d.hora);
      if (d.envioTipo) setEnvioTipo(d.envioTipo);
      if (d.descripcion) setDescripcion(d.descripcion);
      if (d.fechaYmd) {
        const hoy = toYmd(new Date());
        const man = new Date();
        man.setDate(man.getDate() + 1);
        if (d.fechaYmd === hoy) setFechaPreset('hoy');
        else if (d.fechaYmd === toYmd(man)) setFechaPreset('manana');
        else {
          setFechaPreset('otra');
          setFechaOtra(d.fechaYmd);
        }
      }
    } catch {
      /* ignore */
    }
    setDraftRestored(true);
  }, [draftRestored]);

  const fechaYmd = useMemo(() => {
    if (fechaPreset === 'hoy') return toYmd(new Date());
    if (fechaPreset === 'manana') {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      return toYmd(t);
    }
    return fechaOtra || toYmd(new Date());
  }, [fechaPreset, fechaOtra]);

  const farePreview = useMemo(() => {
    if (!desde || !hasta) return null;
    const km = estimateDistanceKm(desde.lat, desde.lng, hasta.lat, hasta.lng);
    return { km, fare: estimateFare(km) };
  }, [desde, hasta]);

  const canSubmit =
    nombre.trim().length >= 2 && !!desde && !!hasta && !!hora && !!fechaYmd;

  const submit = async () => {
    if (!canSubmit) return;

    if (!user) {
      sessionStorage.setItem(
        'buscadis:delivery-draft',
        JSON.stringify({
          nombre,
          desde,
          hasta,
          fechaYmd,
          hora,
          envioTipo,
          descripcion,
        })
      );
      router.push(`/login?redirect=${encodeURIComponent('/delivery/pedir')}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const scheduled = new Date(`${fechaYmd}T${hora}:00`);
      const now = new Date();
      const isSoon =
        fechaPreset === 'hoy' &&
        scheduled.getTime() - now.getTime() < 45 * 60 * 1000;

      const res = await enviosAuthFetch('/api/envios/requests', {
        method: 'POST',
        body: JSON.stringify({
          category: envioTipo,
          contact_name: nombre.trim(),
          description: descripcion.trim() || null,
          pickup: desde,
          dropoff: hasta,
          when_type: isSoon ? 'ahora' : 'programado',
          scheduled_at: scheduled.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar');
      sessionStorage.removeItem('buscadis:delivery-draft');
      router.push(`/delivery/${data.request.id}`);
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
        <div className="mb-5 flex items-center gap-3">
          <Link
            href="/delivery"
            className="rounded-full p-2 hover:bg-[var(--hover-bg)]"
            aria-label="Volver"
          >
            <IconArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">Pedir</h1>
            <p className="text-xs text-[var(--text-secondary)]">Un solo paso · Cusco</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <IconUser size={14} color="var(--brand-blue)" />
              Nombre
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-3 text-sm outline-none focus:border-[var(--brand-blue)]"
            />
          </div>

          <DeliveryPointField
            label="Desde"
            value={desde}
            onChange={setDesde}
            autoLocate
            placeholder="Punto de recojo"
          />

          <DeliveryPointField
            label="Hasta"
            value={hasta}
            onChange={setHasta}
            placeholder="Destino"
          />

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <IconCalendar size={14} color="var(--brand-blue)" />
              Fecha
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['hoy', 'Hoy'],
                  ['manana', 'Mañana'],
                  ['otra', 'Otra'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFechaPreset(id)}
                  className={`rounded-xl border py-2.5 text-sm font-semibold ${
                    fechaPreset === id
                      ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.12)] text-[var(--brand-blue)]'
                      : 'border-[var(--border-color)] text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {fechaPreset === 'otra' && (
              <input
                type="date"
                value={fechaOtra}
                min={toYmd(new Date())}
                onChange={(e) => setFechaOtra(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm"
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <IconClock size={14} color="var(--brand-blue)" />
              Hora
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-color)] px-3 py-3 text-sm outline-none focus:border-[var(--brand-blue)]"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <IconBox size={14} color="var(--brand-blue)" />
              Envío
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERY_ENVIO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEnvioTipo(opt.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    envioTipo === opt.id
                      ? 'border-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.12)]'
                      : 'border-[var(--border-color)]'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${
                      envioTipo === opt.id
                        ? 'text-[var(--brand-blue)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {opt.label}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-snug text-[var(--text-secondary)]">
                    {opt.hint}
                  </div>
                </button>
              ))}
            </div>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder={
                envioTipo === 'acompanamiento'
                  ? 'Ej: llegar a San Sebastián (opcional)'
                  : 'Descripción (opcional)'
              }
              className="mt-2 w-full rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]"
            />
          </div>

          {farePreview && (
            <div className="rounded-2xl bg-[rgba(var(--brand-primary-rgb),0.1)] px-4 py-3 text-sm">
              <span className="text-[var(--text-secondary)]">
                ~{farePreview.km.toFixed(1)} km ·{' '}
              </span>
              <span className="font-bold text-[var(--brand-blue)]">
                {formatFareSoles(farePreview.fare)}
              </span>
              <span className="text-[var(--text-secondary)]">
                {' '}
                · pago en efectivo o Yape
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-lg">
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={() => void submit()}
              className="w-full rounded-full bg-[var(--brand-blue)] py-3.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {submitting
                ? 'Enviando…'
                : user
                  ? 'Pedir delivery'
                  : 'Continuar (iniciar sesión)'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
