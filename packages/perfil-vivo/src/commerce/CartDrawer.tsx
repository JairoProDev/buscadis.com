'use client';

import { useState } from 'react';
import { usePerfil } from '../modulos/PerfilContext';
import { usePvCart } from './CartContext';
import { emitPvCommerceEvent } from './cart';

function formatPen(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}

/**
 * Drawer de pedido — Commerce OS.
 * Crea orden en API y abre WhatsApp con ítems.
 */
export function PvCartDrawer() {
  const { payload } = usePerfil();
  const { items, total, count, open, setOpen, setQty, clear } = usePvCart();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const phone = payload.negocio.contacto.whatsapp;
  const businessId = payload.negocio.id;
  const slug = payload.negocio.slug;

  async function sendOrder() {
    if (!items.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(slug)}/orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((i) => ({
              productId: i.productId,
              title: i.title,
              qty: i.qty,
              price: i.price,
              imageUrl: i.imageUrl,
            })),
            note: note.trim() || undefined,
            sendWhatsapp: true,
          }),
        }
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        orderNumber?: string;
        waUrl?: string;
        orderId?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || 'No se pudo crear el pedido');
        return;
      }
      emitPvCommerceEvent({
        businessProfileId: businessId,
        eventType: 'order_created',
        metadata: { orderId: data.orderId, orderNumber: data.orderNumber },
      });
      clear();
      setOpen(false);
      setNote('');
      if (data.waUrl) {
        window.location.href = data.waUrl;
      }
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="pv-sheet-scrim"
      role="dialog"
      aria-modal="true"
      aria-label="Tu pedido"
      onClick={() => setOpen(false)}
    >
      <div
        className="pv-sheet"
        style={{ paddingBottom: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pv-store-head">
          <h2 className="pv-store-head__title">Tu pedido ({count})</h2>
          <button
            type="button"
            className="pv-store-head__link"
            style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
            onClick={() => setOpen(false)}
          >
            Cerrar
          </button>
        </div>

        {items.length === 0 ? (
          <p className="pv-sheet__desc" style={{ color: 'var(--tx-muted)' }}>
            Agrega productos desde el catálogo.
          </p>
        ) : (
          <ul className="pv-servicios-list">
            {items.map((i) => (
              <li key={i.productId} className="pv-servicio-row" style={{ cursor: 'default' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="pv-servicio-row__nombre">{i.title}</p>
                  <p className="pv-servicio-row__desc">
                    {i.price != null ? formatPen(i.price) : 'Consultar precio'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="pv-card-producto__cta"
                      onClick={() => setQty(i.productId, i.qty - 1)}
                      aria-label="Menos"
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                      {i.qty}
                    </span>
                    <button
                      type="button"
                      className="pv-card-producto__cta"
                      onClick={() => setQty(i.productId, i.qty + 1)}
                      aria-label="Más"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="pv-servicio-row__precio">
                  {i.price != null ? formatPen(i.price * i.qty) : '—'}
                </p>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 ? (
          <>
            <p className="pv-sheet__precio" style={{ marginTop: 16 }}>
              Total {formatPen(total)}
            </p>
            <label style={{ display: 'block', marginTop: 8 }}>
              <span className="pv-servicio-row__desc">Nota (opcional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: 10,
                  borderRadius: 'var(--rd-md)',
                  border: '1px solid var(--bd-hair)',
                  font: 'var(--ts-cuerpo)',
                  resize: 'vertical',
                }}
                placeholder="Ej. delivery, talla, horario…"
              />
            </label>
            {error ? (
              <p style={{ color: 'var(--err)', font: 'var(--ts-meta)', marginTop: 8 }}>{error}</p>
            ) : null}
            <button
              type="button"
              className="pv-barra-accion__primary"
              style={{
                width: '100%',
                marginTop: 12,
                minHeight: 52,
                border: 'none',
                cursor: busy ? 'wait' : 'pointer',
                opacity: busy || !phone ? 0.7 : 1,
              }}
              disabled={busy || !phone}
              onClick={() => void sendOrder()}
            >
              {busy ? 'Enviando…' : 'Enviar pedido por WhatsApp'}
            </button>
            {!phone ? (
              <p className="pv-servicio-row__desc" style={{ marginTop: 8 }}>
                Este negocio aún no tiene WhatsApp configurado.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
