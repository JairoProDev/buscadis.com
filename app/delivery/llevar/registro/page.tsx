'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import {
  MOTO_DOC_LABELS,
  MOTO_DOC_HINTS,
  REQUIRED_DOCS_FOR_SUBMIT,
  type MotoDocType,
  type MotoRider,
  type MotoRiderDoc,
} from '@/lib/envios';
import { enviosAuthFetch } from '@/lib/envios/auth-fetch';
import { CUSCO_ENVIOS_ZONES } from '@/lib/envios/zones';
import { IconArrowLeft } from '@/components/Icons';

const STEPS = [1, 2, 3] as const;

const STEP2_DOCS: MotoDocType[] = ['dni_frente', 'dni_reverso', 'selfie', 'licencia'];
const STEP3_DOCS: MotoDocType[] = [
  'soat',
  'antecedentes_penales',
  'antecedentes_policiales',
  'foto_moto',
  'placa',
];

export default function ConductorRegistroPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [rider, setRider] = useState<MotoRider | null>(null);
  const [docs, setDocs] = useState<MotoRiderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [telefono, setTelefono] = useState('');
  const [placa, setPlaca] = useState('');
  const [zonas, setZonas] = useState<string[]>(['San Sebastián', 'Centro', 'Wanchaq']);
  const [aceptaMandados, setAceptaMandados] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const res = await enviosAuthFetch('/api/envios/rider');
    const data = await res.json();
    if (data.rider) {
      setRider(data.rider);
      setDisplayName(data.rider.display_name || '');
      setTelefono(data.rider.telefono_whatsapp || '');
      setPlaca(data.rider.placa || '');
      setZonas(data.rider.zonas?.length ? data.rider.zonas : zonas);
      setAceptaMandados(data.rider.acepta_mandados_compra ?? true);
      if (data.rider.estado === 'aprobado') {
        router.replace('/delivery/llevar');
      }
    }
    setDocs(data.docs || []);
    setLoading(false);
  }, [user, router]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [user, load]);

  const hasDoc = (tipo: MotoDocType) => docs.some((d) => d.tipo === tipo);

  const saveBasics = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await enviosAuthFetch('/api/envios/rider', {
        method: rider ? 'PATCH' : 'POST',
        body: JSON.stringify({
          display_name: displayName,
          telefono_whatsapp: telefono,
          placa,
          zonas,
          acepta_mandados_compra: aceptaMandados,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setRider(data.rider);
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const ensureRider = async () => {
    if (rider) return rider;
    const res = await enviosAuthFetch('/api/envios/rider', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        telefono_whatsapp: telefono,
        placa,
        zonas,
        acepta_mandados_compra: aceptaMandados,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear perfil');
    setRider(data.rider);
    return data.rider as MotoRider;
  };

  const uploadDoc = async (tipo: MotoDocType, file: File) => {
    setSaving(true);
    setError(null);
    try {
      await ensureRider();
      const fd = new FormData();
      fd.append('tipo', tipo);
      fd.append('file', file);
      const res = await enviosAuthFetch('/api/envios/rider/docs', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const submitReview = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await enviosAuthFetch('/api/envios/rider', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'submit_for_review' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error +
            (data.missing?.length
              ? `: ${data.missing.map((m: string) => MOTO_DOC_LABELS[m as MotoDocType] || m).join(', ')}`
              : '')
        );
      }
      setRider(data.rider);
      router.push('/delivery/llevar');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const toggleZona = (z: string) => {
    setZonas((prev) =>
      prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-10 text-center">
          <p>Inicia sesión para registrarte como motorizado.</p>
          <Link href="/login?redirect=/delivery/llevar/registro" className="text-[var(--brand-blue)]">
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
          href="/delivery/llevar"
          className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <IconArrowLeft size={16} /> Volver
        </Link>

        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Registro motorizado
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          3 pasos. Puedes pausar y continuar después. Revisamos todo a mano — gratis.
        </p>

        <div className="mt-3 flex gap-1">
          {STEPS.map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                s <= step ? 'bg-[var(--brand-blue)]' : 'bg-[var(--border-color)]'
              }`}
            />
          ))}
        </div>

        {loading && <p className="mt-6 text-sm">Cargando…</p>}

        {!loading && step === 1 && (
          <div className="mt-6 space-y-4">
            <h2 className="font-semibold">1. Datos básicos (~2 min)</h2>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nombre para la app"
              className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm"
            />
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="WhatsApp (ej. 984123456)"
              className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm"
            />
            <input
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="Placa de la moto"
              className="w-full rounded-xl border border-[var(--border-color)] px-3 py-2.5 text-sm"
            />
            <div>
              <p className="mb-2 text-sm font-medium">Zonas que cubres</p>
              <div className="flex flex-wrap gap-1.5">
                {CUSCO_ENVIOS_ZONES.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => toggleZona(z)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      zonas.includes(z)
                        ? 'bg-[var(--brand-blue)] text-white'
                        : 'border border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={aceptaMandados}
                onChange={(e) => setAceptaMandados(e.target.checked)}
              />
              Acepto mandados con compra (adelanto de dinero)
            </label>
            <button
              type="button"
              disabled={saving || !displayName || !telefono || !placa || zonas.length === 0}
              onClick={() => void saveBasics()}
              className="w-full rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        )}

        {!loading && step === 2 && (
          <div className="mt-6 space-y-4">
            <h2 className="font-semibold">2. Identidad (~3 min)</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Sube DNI (ambos lados), selfie con el rostro centrado y licencia. Comparamos
              selfie vs DNI a ojo — sin apps raras.
            </p>
            {STEP2_DOCS.map((tipo) => (
              <DocUploadRow
                key={tipo}
                tipo={tipo}
                done={hasDoc(tipo)}
                disabled={saving}
                onFile={(f) => void uploadDoc(tipo, f)}
              />
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-[var(--border-color)] px-4 py-3 text-sm"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!STEP2_DOCS.every(hasDoc)}
                className="flex-1 rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {!loading && step === 3 && (
          <div className="mt-6 space-y-4">
            <h2 className="font-semibold">3. SOAT, antecedentes y moto (~2 min)</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Antecedentes penales y policiales (foto o PDF). Trámites oficiales del Perú.
            </p>
            <a
              href="https://pide.gob.pe/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-[var(--brand-blue)] underline"
            >
              Ayuda: certificados en PIDE / Ministerio del Interior
            </a>
            {STEP3_DOCS.map((tipo) => (
              <DocUploadRow
                key={tipo}
                tipo={tipo}
                done={hasDoc(tipo)}
                disabled={saving}
                onFile={(f) => void uploadDoc(tipo, f)}
              />
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full border border-[var(--border-color)] px-4 py-3 text-sm"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={saving || !REQUIRED_DOCS_FOR_SUBMIT.every(hasDoc)}
                onClick={() => void submitReview()}
                className="flex-1 rounded-full bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Enviar a revisión
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}

function DocUploadRow({
  tipo,
  done,
  disabled,
  onFile,
}: {
  tipo: MotoDocType;
  done: boolean;
  disabled: boolean;
  onFile: (f: File) => void;
}) {
  const hint = MOTO_DOC_HINTS[tipo];
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] px-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{MOTO_DOC_LABELS[tipo]}</div>
        <div className="text-xs text-[var(--text-secondary)]">
          {done ? '✓ Subido' : 'Toca para subir'}
        </div>
        {hint && (
          <p className="mt-1 text-[11px] leading-snug text-[var(--text-secondary)]">{hint}</p>
        )}
      </div>
      <input
        type="file"
        accept={
          tipo.startsWith('antecedentes')
            ? 'image/*,application/pdf'
            : 'image/*'
        }
        capture={
          tipo === 'selfie' ? 'user' : tipo === 'foto_moto' || tipo === 'placa' ? 'environment' : undefined
        }
        disabled={disabled}
        className="max-w-[140px] shrink-0 text-xs"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}
