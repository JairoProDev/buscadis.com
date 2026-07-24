'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { IconClose } from '@/components/Icons';
import type { UserIntencion } from '@/lib/auth/profile-complete';
import { needsBusinessRuc } from '@/lib/auth/profile-complete';

type Step = 'intencion' | 'dni' | 'whatsapp';

type DniData = {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
};

/**
 * Onboarding corto post-login: intención → DNI (+ RUC si publica) → WhatsApp OTP.
 */
export default function OnboardingModal({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { session, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('intencion');
  const [intencion, setIntencion] = useState<UserIntencion | null>(null);
  const [dni, setDni] = useState('');
  const [ruc, setRuc] = useState('');
  const [dniPreview, setDniPreview] = useState<DniData | null>(null);
  const [razonSocial, setRazonSocial] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!abierto || typeof document === 'undefined') return null;

  const authHeaders = (): HeadersInit => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
  };

  const pickIntencion = (value: UserIntencion) => {
    setIntencion(value);
    setError(null);
    setStep('dni');
  };

  const lookupIdentity = async () => {
    setError(null);
    setCargando(true);
    try {
      const dniRes = await fetch('/api/identity/dni', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ dni }),
      });
      const dniJson = await dniRes.json();
      if (!dniRes.ok) {
        setError(dniJson.error || 'No se pudo validar el DNI');
        return;
      }
      setDniPreview(dniJson.data as DniData);

      if (intencion && needsBusinessRuc(intencion)) {
        const rucRes = await fetch('/api/identity/ruc', {
          method: 'POST',
          headers: authHeaders(),
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

  const confirmIdentity = async () => {
    if (!intencion || !dniPreview) return;
    setError(null);
    setCargando(true);
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          intencion,
          dni: dniPreview.dni,
          ruc: needsBusinessRuc(intencion) ? ruc : undefined,
          confirmNombre: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo guardar');
        return;
      }
      await refreshProfile();
      setStep('whatsapp');
    } catch {
      setError('Error al guardar tu identidad');
    } finally {
      setCargando(false);
    }
  };

  const phoneForApi = () => {
    const local = phone.replace(/\D/g, '').replace(/^51/, '');
    return local.length === 9 ? `51${local}` : phone;
  };

  const sendOtp = async () => {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ phone: phoneForApi() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'No se pudo enviar el código');
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
        headers: authHeaders(),
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

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 10002,
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
          borderRadius: '12px',
          padding: '1.75rem',
          maxWidth: '420px',
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
              {step === 'intencion' && '¿Qué quieres hacer?'}
              {step === 'dni' && 'Verifica tu identidad'}
              {step === 'whatsapp' && 'Tu WhatsApp'}
            </h2>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {step === 'intencion' && 'Así te mostramos lo que te sirve. Puedes cambiar después.'}
              {step === 'dni' &&
                'Pedimos tu DNI para evitar fraudes y perfiles falsos. Es por tu seguridad y la de la comunidad.'}
              {step === 'whatsapp' &&
                'Ahí te avisamos de oportunidades. La mayoría revisa WhatsApp más que el correo.'}
            </p>
          </div>
          {/* No permitir cerrar a medias si falta identidad — solo en whatsapp tras identidad */}
          {step === 'whatsapp' && (
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
              borderRadius: 6,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {step === 'intencion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="button" onClick={() => pickIntencion('explorador')} style={choiceBtn}>
              <strong>Buscar oportunidades</strong>
              <span style={choiceSub}>Empleos, deals, productos… soy una persona que busca</span>
            </button>
            <button type="button" onClick={() => pickIntencion('anunciante')} style={choiceBtn}>
              <strong>Publicar ofertas</strong>
              <span style={choiceSub}>Publicaré anuncios (con mi RUC si aplica)</span>
            </button>
            <button type="button" onClick={() => pickIntencion('negocio')} style={choiceBtn}>
              <strong>Tengo un negocio</strong>
              <span style={choiceSub}>Mi RUC queda vinculado a mi cuenta personal (DNI)</span>
            </button>
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

            {intencion && needsBusinessRuc(intencion) && (
              <>
                <label style={{ ...labelStyle, marginTop: '0.75rem' }}>RUC (10 o 20…)</label>
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
                  El negocio no es independiente: queda ligado a tu DNI.
                </p>
              </>
            )}

            {!dniPreview ? (
              <button
                type="button"
                disabled={cargando || dni.length !== 8}
                onClick={lookupIdentity}
                style={{ ...primaryBtn(cargando || dni.length !== 8), marginTop: '1rem' }}
              >
                {cargando ? 'Validando…' : 'Validar con padrón'}
              </button>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                <div
                  style={{
                    padding: '0.75rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    marginBottom: '0.75rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <div>
                    <strong>{dniPreview.nombreCompleto}</strong>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DNI {dniPreview.dni}</div>
                  {razonSocial && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      Negocio: <strong>{razonSocial}</strong>
                    </div>
                  )}
                </div>
                <button type="button" disabled={cargando} onClick={confirmIdentity} style={primaryBtn(cargando)}>
                  {cargando ? 'Guardando…' : 'Confirmar, soy yo'}
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

            <button type="button" onClick={() => setStep('intencion')} style={{ ...linkBtn, display: 'block', marginTop: '1rem' }}>
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
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Dev: código {devCode}
                  </p>
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
  borderRadius: '6px',
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

const choiceBtn: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.9rem 1rem',
  borderRadius: 10,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  color: 'var(--text-primary)',
};

const choiceSub: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  fontWeight: 400,
};

const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  textDecoration: 'underline',
  fontSize: '0.85rem',
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: disabled ? 'var(--text-tertiary)' : 'var(--text-primary)',
    color: 'var(--bg-primary)',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
