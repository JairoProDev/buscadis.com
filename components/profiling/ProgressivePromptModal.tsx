'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { IconClose, IconExplore, IconMegaphone, IconStore, IconMotorcycle, IconInfluencer } from '@/components/Icons';
import type { CapabilityKey } from '@/lib/auth/capability-types';
import type { Genero } from '@/types';
import type { ProfilePromptId } from '@/lib/profiling/prompt-types';
import {
  hasShownPromptThisSession,
  isProgressiveProfilingEligible,
  markPromptShownThisSession,
} from '@/lib/profiling/prompt-queue';

type NextPrompt = {
  id: ProfilePromptId;
  title: string;
  subtitle: string;
  cta: string;
};

type Usefulness = { done: number; total: number; ratio: number };

type DniPreview = {
  dni: string;
  nombreCompleto: string;
};

const CAP_CARDS: Array<{
  key: CapabilityKey;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}> = [
  {
    key: 'publish',
    title: 'Publicar un adiso',
    subtitle: 'Aviso clasificado',
    Icon: IconMegaphone,
  },
  {
    key: 'business',
    title: 'Mi negocio',
    subtitle: 'Catálogo con RUC',
    Icon: IconStore,
  },
  {
    key: 'rider',
    title: 'Hacer delivery',
    subtitle: 'Llevar envíos en moto',
    Icon: IconMotorcycle,
  },
  {
    key: 'influencer',
    title: 'Ser influencer',
    subtitle: 'Referidos y UGC',
    Icon: IconInfluencer,
  },
];

export default function ProgressivePromptModal() {
  const { user, session, refreshProfile } = useAuth();
  const [prompt, setPrompt] = useState<NextPrompt | null>(null);
  const [usefulness, setUsefulness] = useState<Usefulness | null>(null);
  const [open, setOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // whatsapp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  // demographics
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState<Genero | ''>('');

  // dni
  const [dni, setDni] = useState('');
  const [dniPreview, setDniPreview] = useState<DniPreview | null>(null);

  // intents
  const [interests, setInterests] = useState<CapabilityKey[]>([]);

  const authHeaders = useMemo((): HeadersInit => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  }, [session?.access_token]);

  const resetFields = () => {
    setError(null);
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setDevCode(null);
    setFechaNacimiento('');
    setGenero('');
    setDni('');
    setDniPreview(null);
    setInterests([]);
  };

  const closeModal = useCallback(() => {
    setOpen(false);
    setPrompt(null);
    resetFields();
  }, []);

  const loadNext = useCallback(async () => {
    if (!user?.id || !session?.access_token) return;
    if (!isProgressiveProfilingEligible(user.id)) return;
    if (hasShownPromptThisSession(user.id)) return;

    try {
      const res = await fetch('/api/profiling/prompts/next', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = await res.json();
      setUsefulness(json.usefulness ?? null);
      if (!json.prompt) return;
      markPromptShownThisSession(user.id);
      setPrompt(json.prompt as NextPrompt);
      setOpen(true);
    } catch {
      /* non-blocking */
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    if (!user || !session?.access_token) return;
    const t = window.setTimeout(() => {
      void loadNext();
    }, 800);
    return () => window.clearTimeout(t);
  }, [user, session?.access_token, loadNext]);

  const dismiss = async () => {
    if (!prompt || !session?.access_token) {
      closeModal();
      return;
    }
    setCargando(true);
    try {
      await fetch('/api/profiling/prompts/dismiss', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({ prompt_id: prompt.id }),
      });
    } catch {
      /* still close */
    } finally {
      setCargando(false);
      closeModal();
    }
  };

  const phoneForApi = () => {
    const local = phone.replace(/\D/g, '').replace(/^51/, '');
    return local.length === 9 ? `51${local}` : phone;
  };

  const verifyOtp = async () => {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({ phone: phoneForApi(), code: otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Código incorrecto');
        return;
      }
      await fetch('/api/profiling/prompts/complete', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({ prompt_id: 'whatsapp', phone: phoneForApi() }),
      });
      await refreshProfile();
      closeModal();
    } catch {
      setError('Error al verificar');
    } finally {
      setCargando(false);
    }
  };

  const lookupDni = async () => {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch('/api/identity/dni', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({ dni }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo validar el DNI');
        return;
      }
      setDniPreview({
        dni: json.data.dni,
        nombreCompleto: json.data.nombreCompleto,
      });
    } catch {
      setError('Error al consultar DNI');
    } finally {
      setCargando(false);
    }
  };

  const complete = async () => {
    if (!prompt) return;
    setError(null);
    setCargando(true);
    try {
      if (prompt.id === 'whatsapp') {
        if (otpSent) {
          await verifyOtp();
          return;
        }
        const res = await fetch('/api/profiling/prompts/complete', {
          method: 'POST',
          headers: authHeaders,
          credentials: 'include',
          body: JSON.stringify({ prompt_id: 'whatsapp', phone: phoneForApi() }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'No se pudo guardar');
          return;
        }
        await refreshProfile();
        // Optional OTP step (same modal); if send fails, number is already saved
        const otpRes = await fetch('/api/auth/whatsapp/send-otp', {
          method: 'POST',
          headers: authHeaders,
          credentials: 'include',
          body: JSON.stringify({ phone: phoneForApi() }),
        });
        const otpJson = await otpRes.json();
        if (otpRes.ok) {
          setOtpSent(true);
          if (otpJson.devCode) setDevCode(otpJson.devCode);
          return;
        }
        closeModal();
        return;
      }

      if (prompt.id === 'dni_soft') {
        if (!dniPreview) {
          await lookupDni();
          return;
        }
        const res = await fetch('/api/profiling/prompts/complete', {
          method: 'POST',
          headers: authHeaders,
          credentials: 'include',
          body: JSON.stringify({ prompt_id: 'dni_soft', dni: dniPreview.dni }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'No se pudo guardar el DNI');
          return;
        }
        await refreshProfile();
        closeModal();
        return;
      }

      const payload: Record<string, unknown> = { prompt_id: prompt.id };
      if (prompt.id === 'demographics') {
        payload.fecha_nacimiento = fechaNacimiento || undefined;
        payload.genero = genero || undefined;
      }
      if (prompt.id === 'intents') {
        payload.interests = interests;
      }

      const res = await fetch('/api/profiling/prompts/complete', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo guardar');
        return;
      }
      await refreshProfile();
      closeModal();
    } catch {
      setError('Error de red');
    } finally {
      setCargando(false);
    }
  };

  const toggleInterest = (key: CapabilityKey) => {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (!open || !prompt || typeof document === 'undefined') return null;

  const primaryLabel = (() => {
    if (prompt.id === 'whatsapp') {
      if (otpSent) return 'Verificar código';
      return prompt.cta;
    }
    if (prompt.id === 'dni_soft') {
      return dniPreview ? prompt.cta : 'Validar DNI';
    }
    return prompt.cta;
  })();

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="progressive-prompt-title"
    >
      <div
        className="relative z-[10051] max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => void dismiss()}
          disabled={cargando}
          aria-label="Omitir por ahora"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
        >
          <IconClose size={18} />
        </button>

        {usefulness && usefulness.total > 0 && (
          <div className="mb-4 pr-8">
            <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span>Perfil útil</span>
              <span>
                {usefulness.done}/{usefulness.total}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
              <div
                className="h-full rounded-full bg-[var(--text-primary)] transition-all"
                style={{ width: `${Math.round(usefulness.ratio * 100)}%` }}
              />
            </div>
          </div>
        )}

        <h2
          id="progressive-prompt-title"
          className="m-0 pr-8 text-xl font-semibold text-[var(--text-primary)]"
        >
          {prompt.title}
        </h2>
        <p className="mt-2 mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          {prompt.subtitle}
        </p>

        {error && (
          <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {prompt.id === 'whatsapp' && (
          <div className="space-y-3">
            <label className="block text-sm text-[var(--text-secondary)]">
              Celular WhatsApp
              <div className="mt-1 flex overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]">
                <span className="flex items-center px-3 text-sm text-[var(--text-secondary)]">
                  +51
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="987654321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  disabled={otpSent}
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2.5 text-[var(--text-primary)] outline-none"
                />
              </div>
            </label>
            {otpSent && (
              <label className="block text-sm text-[var(--text-secondary)]">
                Código
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-[var(--text-primary)] outline-none"
                />
              </label>
            )}
            {devCode && (
              <p className="m-0 text-xs text-amber-400">Dev: código {devCode}</p>
            )}
            {otpSent && (
              <button
                type="button"
                className="text-xs text-[var(--accent-blue)] underline"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setDevCode(null);
                }}
              >
                Cambiar número
              </button>
            )}
          </div>
        )}

        {prompt.id === 'demographics' && (
          <div className="space-y-3">
            <label className="block text-sm text-[var(--text-secondary)]">
              Fecha de nacimiento (opcional)
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-[var(--text-primary)] outline-none"
              />
            </label>
            <label className="block text-sm text-[var(--text-secondary)]">
              Género (opcional)
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value as Genero | '')}
                className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-[var(--text-primary)] outline-none"
              >
                <option value="">Seleccionar</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
            </label>
          </div>
        )}

        {prompt.id === 'dni_soft' && (
          <div className="space-y-3">
            <label className="block text-sm text-[var(--text-secondary)]">
              DNI (8 dígitos)
              <input
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={dni}
                onChange={(e) => {
                  setDni(e.target.value.replace(/\D/g, '').slice(0, 8));
                  setDniPreview(null);
                }}
                className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-[var(--text-primary)] outline-none"
              />
            </label>
            {dniPreview && (
              <div className="rounded-lg bg-[var(--bg-tertiary)] px-3 py-3">
                <p className="m-0 text-sm font-semibold text-[var(--text-primary)]">
                  {dniPreview.nombreCompleto}
                </p>
                <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">
                  DNI {dniPreview.dni}
                </p>
              </div>
            )}
          </div>
        )}

        {prompt.id === 'intents' && (
          <div className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto pr-0.5">
            <button
              type="button"
              onClick={() => setInterests([])}
              className={`rounded-xl border p-3 text-left transition ${
                interests.length === 0
                  ? 'border-[var(--text-primary)] bg-[var(--bg-tertiary)]'
                  : 'border-[var(--border-color)]'
              }`}
            >
              <IconExplore size={20} />
              <p className="m-0 mt-2 text-sm font-medium text-[var(--text-primary)]">Solo explorar</p>
              <p className="m-0 text-xs text-[var(--text-secondary)]">Buscar oportunidades</p>
            </button>
            {CAP_CARDS.map(({ key, title, subtitle, Icon }) => {
              const active = interests.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleInterest(key)}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-[var(--text-primary)] bg-[var(--bg-tertiary)]'
                      : 'border-[var(--border-color)]'
                  }`}
                >
                  <Icon size={20} />
                  <p className="m-0 mt-2 text-sm font-medium text-[var(--text-primary)]">{title}</p>
                  <p className="m-0 text-xs text-[var(--text-secondary)]">{subtitle}</p>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={cargando}
          onClick={() => void complete()}
          className="mt-5 w-full rounded-xl bg-[var(--text-primary)] py-3 text-sm font-semibold text-[var(--bg-primary)] disabled:opacity-60"
        >
          {cargando ? 'Guardando…' : primaryLabel}
        </button>

        {prompt.id === 'whatsapp' && otpSent && (
          <button
            type="button"
            disabled={cargando}
            onClick={async () => {
              await refreshProfile();
              closeModal();
            }}
            className="mt-2 w-full py-2 text-sm text-[var(--text-secondary)] underline"
          >
            Guardar número y verificar después
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
