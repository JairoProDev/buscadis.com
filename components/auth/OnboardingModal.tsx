'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { IconClose, IconExplore, IconMegaphone, IconStore, IconMotorcycle, IconInfluencer } from '@/components/Icons';
import type { CapabilityKey } from '@/lib/auth/capability-types';
import { getStoredReferralCode, clearStoredReferralCode } from '@/lib/auth/referral-capture';
import type { Genero } from '@/types';

type Step = 'dni' | 'demographics' | 'whatsapp' | 'capabilities';

type DniData = {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
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
    subtitle: 'Catálogo virtual con RUC',
    Icon: IconStore,
  },
  {
    key: 'rider',
    title: 'Hacer delivery',
    subtitle: 'Gana con envíos en moto',
    Icon: IconMotorcycle,
  },
  {
    key: 'influencer',
    title: 'Ser influencer',
    subtitle: 'Referidos, UGC y afiliados',
    Icon: IconInfluencer,
  },
];

export default function OnboardingModal({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { session, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('dni');
  const [dni, setDni] = useState('');
  const [ruc, setRuc] = useState('');
  const [dniPreview, setDniPreview] = useState<DniData | null>(null);
  const [razonSocial, setRazonSocial] = useState<string | null>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState<Genero | ''>('');
  const [interests, setInterests] = useState<CapabilityKey[]>([]);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identitySaved, setIdentitySaved] = useState(false);

  const wantsBusiness = interests.includes('business');

  useEffect(() => {
    if (!abierto) return;
    document.body.classList.add('buscadis-modal-open');
    return () => document.body.classList.remove('buscadis-modal-open');
  }, [abierto]);

  const authHeaders = useMemo((): HeadersInit => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  }, [session?.access_token]);

  if (!abierto || typeof document === 'undefined') return null;

  const phoneForApi = () => {
    const local = phone.replace(/\D/g, '').replace(/^51/, '');
    return local.length === 9 ? `51${local}` : phone;
  };

  const toggleInterest = (key: CapabilityKey) => {
    setInterests((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const lookupIdentity = async () => {
    setError(null);
    setCargando(true);
    try {
      const dniRes = await fetch('/api/identity/dni', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({ dni }),
      });
      const dniJson = await dniRes.json();
      if (!dniRes.ok) {
        setError(dniJson.error || 'No se pudo validar el DNI');
        return;
      }
      setDniPreview(dniJson.data as DniData);

      if (wantsBusiness && ruc.replace(/\D/g, '').length === 11) {
        const rucRes = await fetch('/api/identity/ruc', {
          method: 'POST',
          headers: authHeaders,
          credentials: 'include',
          body: JSON.stringify({ ruc }),
        });
        const rucJson = await rucRes.json();
        if (!rucRes.ok) {
          setError(rucJson.error || 'No se pudo validar el RUC');
          return;
        }
        setRazonSocial(rucJson.data?.razonSocial || null);
      } else {
        setRazonSocial(null);
      }
    } catch {
      setError('Error de red al validar identidad');
    } finally {
      setCargando(false);
    }
  };

  const saveIdentity = async () => {
    if (!dniPreview) return;
    setError(null);
    setCargando(true);
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({
          dni: dniPreview.dni,
          ruc: wantsBusiness ? ruc : undefined,
          fecha_nacimiento: fechaNacimiento || undefined,
          genero: genero || undefined,
          interests,
          referred_by_code: getStoredReferralCode(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo guardar');
        return;
      }
      clearStoredReferralCode();
      setIdentitySaved(true);
      await refreshProfile();
      setStep('whatsapp');
    } catch {
      setError('Error al guardar tu identidad');
    } finally {
      setCargando(false);
    }
  };

  const sendOtp = async () => {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({ phone: phoneForApi() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo enviar el código');
        return;
      }
      if (json.skipVerification) {
        // Sin Meta: no pedimos código; el número ya está en el perfil via onboarding
        await refreshProfile();
        setStep('capabilities');
        return;
      }
      setOtpSent(true);
      setDevCode(json.devCode || null);
    } catch {
      setError('Error al enviar WhatsApp');
    } finally {
      setCargando(false);
    }
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
      await refreshProfile();
      onCerrar();
    } catch {
      setError('Error al verificar');
    } finally {
      setCargando(false);
    }
  };

  const title =
    step === 'dni'
      ? 'Verifica tu identidad'
      : step === 'demographics'
        ? 'Personaliza tu experiencia'
        : step === 'capabilities'
          ? '¿Qué te interesa hacer?'
          : 'Tu WhatsApp';

  const subtitle =
    step === 'dni'
      ? 'Pedimos tu DNI para evitar fraudes. Es por tu seguridad y la de la comunidad.'
      : step === 'demographics'
        ? 'Google no comparte edad ni género. Tú los confirmas (opcional) para mejores oportunidades.'
        : step === 'capabilities'
          ? 'Puedes activar varias. Todas parten de tu perfil de usuario. Puedes cambiar después.'
          : 'Ahí te avisamos de oportunidades. La mayoría revisa WhatsApp más que el correo.';

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 20000,
        isolation: 'isolate',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 16,
          padding: '1.75rem',
          maxWidth: 440,
          width: '100%',
          margin: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 id="onboarding-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {title}
            </h2>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {subtitle}
            </p>
          </div>
          {step === 'whatsapp' && identitySaved && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Ahora no"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <IconClose size={20} />
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '0.65rem',
              marginBottom: '0.75rem',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {step === 'dni' && (
          <div>
            <label style={labelStyle}>DNI (8 dígitos)</label>
            <input
              inputMode="numeric"
              maxLength={8}
              value={dni}
              onChange={(e) => {
                setDni(e.target.value.replace(/\D/g, '').slice(0, 8));
                setDniPreview(null);
              }}
              placeholder="12345678"
              style={inputStyle}
            />

            {!dniPreview ? (
              <button
                type="button"
                disabled={cargando || dni.length !== 8}
                onClick={lookupIdentity}
                style={{ ...primaryBtn(cargando || dni.length !== 8), marginTop: '1rem' }}
              >
                {cargando ? 'Validando…' : 'Validar con SUNAT'}
              </button>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                <div style={previewBox}>
                  <strong>{dniPreview.nombreCompleto}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DNI {dniPreview.dni}</div>
                  {razonSocial && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      Negocio: <strong>{razonSocial}</strong>
                    </div>
                  )}
                </div>
                <button type="button" disabled={cargando} onClick={() => setStep('demographics')} style={primaryBtn(cargando)}>
                  Confirmar, soy yo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDniPreview(null);
                    setRazonSocial(null);
                  }}
                  style={{ ...linkBtn, display: 'block', margin: '0.75rem auto 0' }}
                >
                  Corregir datos
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'demographics' && (
          <div>
            <label style={labelStyle}>Fecha de nacimiento (opcional)</label>
            <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} style={inputStyle} />
            <label style={{ ...labelStyle, marginTop: '0.85rem' }}>Género (opcional)</label>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value as Genero | '')}
              style={inputStyle}
            >
              <option value="">Prefiero elegir después</option>
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
              <option value="prefiero_no_decir">Prefiero no decir</option>
            </select>
            <button type="button" onClick={() => setStep('capabilities')} style={{ ...primaryBtn(false), marginTop: '1rem' }}>
              Continuar
            </button>
            <button type="button" onClick={() => setStep('dni')} style={{ ...linkBtn, display: 'block', marginTop: '0.75rem' }}>
              ← Volver
            </button>
          </div>
        )}

        {step === 'capabilities' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
              }}
            >
              <div style={{ ...capCard(false), gridColumn: '1 / -1', cursor: 'default', opacity: 0.95 }}>
                <IconExplore size={40} color="var(--brand-blue)" />
                <strong style={{ marginTop: 8 }}>Usuario Buscadis</strong>
                <span style={capSub}>Siempre activo: buscar y encontrar</span>
              </div>
              {CAP_CARDS.map(({ key, title: t, subtitle: s, Icon }) => {
                const on = interests.includes(key);
                return (
                  <button key={key} type="button" onClick={() => toggleInterest(key)} style={capCard(on)}>
                    <Icon size={40} color={on ? 'var(--brand-blue)' : 'var(--text-secondary)'} />
                    <strong style={{ marginTop: 8, fontSize: '0.9rem' }}>{t}</strong>
                    <span style={capSub}>{s}</span>
                  </button>
                );
              })}
            </div>

            {wantsBusiness && (
              <div style={{ marginTop: '1rem' }}>
                <label style={labelStyle}>RUC de tu negocio (10 o 20…)</label>
                <input
                  inputMode="numeric"
                  maxLength={11}
                  value={ruc}
                  onChange={(e) => {
                    setRuc(e.target.value.replace(/\D/g, '').slice(0, 11));
                    setRazonSocial(null);
                  }}
                  placeholder="20xxxxxxxxx"
                  style={inputStyle}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
                  Queda vinculado a tu DNI (persona). Puedes completarlo después.
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={cargando}
              onClick={async () => {
                if (wantsBusiness && ruc.replace(/\D/g, '').length === 11 && dniPreview) {
                  setCargando(true);
                  try {
                    const rucRes = await fetch('/api/identity/ruc', {
                      method: 'POST',
                      headers: authHeaders,
                      credentials: 'include',
                      body: JSON.stringify({ ruc }),
                    });
                    const rucJson = await rucRes.json();
                    if (rucRes.ok) setRazonSocial(rucJson.data?.razonSocial || null);
                  } finally {
                    setCargando(false);
                  }
                }
                await saveIdentity();
              }}
              style={{ ...primaryBtn(cargando), marginTop: '1rem' }}
            >
              {cargando ? 'Guardando…' : 'Continuar'}
            </button>
            <button type="button" onClick={() => setStep('demographics')} style={{ ...linkBtn, display: 'block', marginTop: '0.75rem' }}>
              ← Volver
            </button>
          </div>
        )}

        {step === 'whatsapp' && (
          <div>
            <label style={labelStyle}>Celular WhatsApp</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>+51</span>
              <input
                inputMode="numeric"
                maxLength={9}
                value={phone.replace(/^51/, '')}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="987654321"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>

            {!otpSent ? (
              <button
                type="button"
                disabled={cargando || phone.replace(/^51/, '').length !== 9}
                onClick={sendOtp}
                style={{ ...primaryBtn(cargando || phone.replace(/^51/, '').length !== 9), marginTop: '1rem' }}
              >
                {cargando ? 'Enviando…' : 'Enviar código por WhatsApp'}
              </button>
            ) : (
              <>
                <label style={{ ...labelStyle, marginTop: '1rem' }}>Código de 6 dígitos</label>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={inputStyle}
                />
                {devCode && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dev: código {devCode}</p>
                )}
                <button
                  type="button"
                  disabled={cargando || otp.length !== 6}
                  onClick={verifyOtp}
                  style={{ ...primaryBtn(cargando || otp.length !== 6), marginTop: '0.75rem' }}
                >
                  {cargando ? 'Verificando…' : 'Confirmar y listo'}
                </button>
                <button type="button" onClick={sendOtp} disabled={cargando} style={{ ...linkBtn, display: 'block', marginTop: '0.75rem' }}>
                  Reenviar código
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  fontSize: '0.875rem',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem',
};

const previewBox: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: 10,
  border: '1px solid var(--border-color)',
  marginBottom: '0.75rem',
  fontSize: '0.9rem',
};

const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  textDecoration: 'underline',
  fontSize: '0.85rem',
};

const capSub: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--text-secondary)',
  textAlign: 'center',
  lineHeight: 1.3,
  marginTop: 4,
};

function capCard(on: boolean): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '1rem 0.65rem',
    borderRadius: 14,
    border: on ? '2px solid var(--brand-blue)' : '1px solid var(--border-color)',
    background: on ? 'rgba(var(--brand-primary-rgb), 0.08)' : 'var(--bg-primary)',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  };
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
    color: 'var(--bg-primary)',
    border: 'none',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
