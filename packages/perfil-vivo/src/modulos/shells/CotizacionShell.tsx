'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { usePerfil } from '../PerfilContext';
import { emitPvCommerceEvent } from '../../commerce/cart';

/** P4 — Cotizar (alto_ticket). */
export function CotizacionShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (payload.negocio.arquetipo !== 'alto_ticket') return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(payload.negocio.slug)}/quotes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: name,
            customerPhone: phone,
            customerEmail: email || undefined,
            summary,
          }),
        }
      );
      const data = await res.json();
      emitPvCommerceEvent({
        businessProfileId: payload.negocio.id,
        eventType: 'purchase_intent',
        metadata: { surface: 'cotizacion', quoteId: data.quoteId },
      });
      if (data.waUrl) {
        window.location.href = data.waUrl;
        return;
      }
      setMsg(data.ok ? 'Cotización enviada.' : data.error || 'Error');
    } catch {
      setMsg('Error de red');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="pv-modulo" id="cotizacion">
      <h2 className="pv-store-head__title" style={{ marginBottom: 12 }}>
        {titulo || 'Pedir cotización'}
      </h2>
      <form onSubmit={submit} className="pv-servicios-list">
        <label className="pv-servicio-row" style={{ flexDirection: 'column', gap: 6 }}>
          <span className="pv-servicio-row__nombre">Tu nombre</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </label>
        <label className="pv-servicio-row" style={{ flexDirection: 'column', gap: 6 }}>
          <span className="pv-servicio-row__nombre">WhatsApp / teléfono</span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
            inputMode="tel"
          />
        </label>
        <label className="pv-servicio-row" style={{ flexDirection: 'column', gap: 6 }}>
          <span className="pv-servicio-row__nombre">Email (opcional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label className="pv-servicio-row" style={{ flexDirection: 'column', gap: 6 }}>
          <span className="pv-servicio-row__nombre">¿Qué necesitas?</span>
          <textarea
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            style={inputStyle}
            placeholder="Proyecto, medidas, presupuesto…"
          />
        </label>
        {msg ? <p className="pv-servicio-row__desc">{msg}</p> : null}
        <button
          type="submit"
          className="pv-barra-accion__primary"
          style={{ minHeight: 48, border: 'none', cursor: 'pointer' }}
          disabled={busy}
        >
          {busy ? 'Enviando…' : 'Enviar cotización por WhatsApp'}
        </button>
      </form>
    </section>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 'var(--rd-md)',
  border: '1px solid var(--bd-hair)',
  font: 'var(--ts-cuerpo)',
  boxSizing: 'border-box',
};
