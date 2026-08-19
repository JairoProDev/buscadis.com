'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { usePerfil } from '../PerfilContext';
import { emitPvCommerceEvent } from '../../commerce/cart';

/** P4 — Agendar (cita / profesional). */
export function ReservaShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const arq = payload.negocio.arquetipo;
  if (arq !== 'cita' && arq !== 'profesional') return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!when || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const startsAt = new Date(when).toISOString();
      const res = await fetch(
        `/api/business/${encodeURIComponent(payload.negocio.slug)}/reservations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: name,
            customerPhone: phone,
            customerNote: note || undefined,
            startsAt,
          }),
        }
      );
      const data = await res.json();
      emitPvCommerceEvent({
        businessProfileId: payload.negocio.id,
        eventType: 'purchase_intent',
        metadata: { surface: 'reserva', reservationId: data.reservationId },
      });
      if (data.waUrl) {
        window.location.href = data.waUrl;
        return;
      }
      setMsg(data.ok ? 'Solicitud enviada.' : data.error || 'Error');
    } catch {
      setMsg('Error de red');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="pv-modulo" id="reserva">
      <h2 className="pv-store-head__title" style={{ marginBottom: 12 }}>
        {titulo || 'Agendar'}
      </h2>
      <form onSubmit={submit} className="pv-servicios-list">
        <label className="pv-servicio-row" style={{ flexDirection: 'column', gap: 6 }}>
          <span className="pv-servicio-row__nombre">Tu nombre</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
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
          <span className="pv-servicio-row__nombre">Fecha y hora</span>
          <input
            required
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label className="pv-servicio-row" style={{ flexDirection: 'column', gap: 6 }}>
          <span className="pv-servicio-row__nombre">Nota (opcional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={inputStyle} />
        </label>
        {msg ? <p className="pv-servicio-row__desc">{msg}</p> : null}
        <button
          type="submit"
          className="pv-barra-accion__primary"
          style={{ minHeight: 48, border: 'none', cursor: 'pointer' }}
          disabled={busy}
        >
          {busy ? 'Enviando…' : 'Solicitar cita por WhatsApp'}
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
