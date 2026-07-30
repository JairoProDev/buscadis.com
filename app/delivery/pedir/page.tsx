'use client';

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface Favorite {
  id: string;
  label: string | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_text: string;
  pickup_zona: string | null;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_text: string;
  dropoff_zona: string | null;
}

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

const ONBOARDING_KEY = 'buscadis:delivery-onboarding-v1';

export default function DeliveryPedirPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-primary)]">
          <Header />
          <main className="mx-auto max-w-lg px-4 py-10 text-sm text-[var(--text-secondary)]">
            Cargando…
          </main>
        </div>
      }
    >
      <DeliveryPedirInner />
    </Suspense>
  );
}

function DeliveryPedirInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceAdisoId = searchParams.get('adiso');
  const { user, profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState('');
  const [desde, setDesde] = useState<DeliveryMapPoint | null>(null);
  const [hasta, setHasta] = useState<DeliveryMapPoint | null>(null);
  const [fechaPreset, setFechaPreset] = useState<FechaPreset>('hoy');
  const [fechaOtra, setFechaOtra] = useState('');
  const [hora, setHora] = useState(defaultTimeSoon);
  const [envioTipo, setEnvioTipo] = useState<EnvioTipo>('paquete');
  const [descripcion, setDescripcion] = useState('');
  const [budget, setBudget] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (profile?.nombre && !nombre) setNombre(profile.nombre);
  }, [profile?.nombre, nombre]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await enviosAuthFetch('/api/envios/favorites');
        const data = await res.json();
        if (res.ok) setFavorites(data.favorites || []);
      } catch {
        /* ignore */
      }
    })();
  }, [user]);

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
      if (d.budget) setBudget(d.budget);
      if (d.photoUrl) setPhotoUrl(d.photoUrl);
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

  const selectedOpt = DELIVERY_ENVIO_OPTIONS.find((o) => o.id === envioTipo);

  const canSubmit =
    nombre.trim().length >= 2 &&
    !!desde &&
    !!hasta &&
    !!hora &&
    !!fechaYmd &&
    descripcion.trim().length >= 3;

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  const applyFavorite = (f: Favorite) => {
    setDesde({
      lat: Number(f.pickup_lat),
      lng: Number(f.pickup_lng),
      text: f.pickup_text,
      zona: f.pickup_zona,
    });
    setHasta({
      lat: Number(f.dropoff_lat),
      lng: Number(f.dropoff_lng),
      text: f.dropoff_text,
      zona: f.dropoff_zona,
    });
  };

  const uploadPhoto = async (file: File) => {
    if (!user) {
      setError('Inicia sesión para subir foto');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await enviosAuthFetch('/api/envios/upload-package', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo subir');
      setPhotoUrl(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

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
          budget,
          photoUrl,
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
          description: descripcion.trim(),
          photo_url: photoUrl,
          pickup: desde,
          dropoff: hasta,
          when_type: isSoon ? 'ahora' : 'programado',
          scheduled_at: scheduled.toISOString(),
          budget_estimate:
            envioTipo === 'mandado' && budget
              ? Number(budget)
              : undefined,
          source_adiso_id: sourceAdisoId || undefined,
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
            <p className="text-xs text-[var(--text-secondary)]">
              Mismo formato de siempre · privado en la app
            </p>
          </div>
        </div>

        {sourceAdisoId && (
          <p className="mb-4 rounded-xl bg-[rgba(var(--brand-primary-rgb),0.08)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            Entrega vinculada a un anuncio de Buscadis.
          </p>
        )}

        {showOnboarding && (
          <div className="mb-5 rounded-3xl border border-[var(--brand-blue)]/25 bg-[rgba(var(--brand-primary-rgb),0.08)] p-4">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              En 30 segundos: cómo funciona
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[var(--text-secondary)]">
              <li>Completas nombre, recojo, destino, hora y qué envías.</li>
              <li>Motorizados verificados ven tu pedido — sin publicar tu número.</li>
              <li>Coordinas por el chat de Buscadis. Pagas en efectivo o Yape.</li>
            </ol>
            <button
              type="button"
              onClick={dismissOnboarding}
              className="mt-3 w-full rounded-full bg-[var(--brand-blue)] py-2.5 text-sm font-semibold text-white"
            >
              Entendido — pedir ahora
            </button>
          </div>
        )}

        {favorites.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              Tus rutas
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {favorites.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => applyFavorite(f)}
                  className="shrink-0 rounded-full border border-[var(--border-color)] px-3 py-1.5 text-xs font-semibold"
                >
                  {f.label || 'Ruta'}
                </button>
              ))}
            </div>
          </div>
        )}

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
            label="Punto de recojo"
            value={desde}
            onChange={setDesde}
            autoLocate
            placeholder="Ej: Paradero Universidad Andina"
          />

          <DeliveryPointField
            label="Destino"
            value={hasta}
            onChange={setHasta}
            placeholder="Ej: CIAM, espaldas mercado Ttio"
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
            {fechaPreset === 'manana' && (
              <p className="mt-1.5 text-[11px] text-[var(--text-secondary)]">
                Ideal para reservar temprano (7–9 am). Avisamos a los motorizados a tiempo.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <IconClock size={14} color="var(--brand-blue)" />
              Hora del servicio
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
              ¿Qué envías?
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
              placeholder={selectedOpt?.example || 'Describe el envío'}
              className="mt-2 w-full rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]"
            />
            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
              Obligatorio — el motorizado necesita saber qué lleva.
            </p>
          </div>

          {envioTipo === 'mandado' && (
            <div>
              <label className="mb-1.5 text-sm font-semibold">
                Presupuesto estimado de la compra (S/)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ej: 30"
                className="w-full rounded-xl border border-[var(--border-color)] px-3 py-3 text-sm"
              />
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                El motorizado adelanta; le pagas al recibir (+ tarifa del envío).
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 text-sm font-semibold">Foto del envío (opcional)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPhoto(f);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-[var(--border-color)] py-3 text-sm font-semibold"
            >
              {uploading ? 'Subiendo…' : photoUrl ? 'Cambiar foto' : 'Agregar foto'}
            </button>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Vista previa"
                className="mt-2 max-h-40 w-full rounded-xl object-cover"
              />
            )}
          </div>

          {farePreview && (
            <div className="rounded-2xl bg-[rgba(var(--brand-primary-rgb),0.1)] px-4 py-3 text-sm">
              <div className="font-bold text-[var(--brand-blue)]">
                {formatFareSoles(farePreview.fare)}
                <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">
                  estimado · ~{farePreview.km.toFixed(1)} km
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Ves el precio antes de pedir. Pago en efectivo o Yape al motorizado — sin comisión
                de la app.
              </p>
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
