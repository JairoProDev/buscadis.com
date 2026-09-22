'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePerfil } from '../modulos/PerfilContext';
import { usePvCart } from './CartContext';
import { emitPvCommerceEvent } from './cart';
import { buildPedidoSharePath, encodePedidoCart } from './pedido-link';

function formatPen(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}

/**
 * Drawer de pedido — Commerce OS.
 * Escape cierra, body lock, empty con ancla a catálogo, WA con ítems.
 */
export function PvCartDrawer() {
  const { payload } = usePerfil();
  const {
    items,
    total,
    count,
    open,
    setOpen,
    setQty,
    removeItem,
    clear,
    pendingNote,
    setPendingNote,
  } = usePvCart();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [doneShareUrl, setDoneShareUrl] = useState<string | null>(null);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const phone = payload.negocio.contacto.whatsapp;
  const businessId = payload.negocio.id;
  const slug = payload.negocio.slug;
  const arq = payload.negocio.arquetipo;
  const sendLabel =
    arq === 'comida' ? 'Enviar pedido por WhatsApp' : 'Enviar consulta por WhatsApp';

  useEffect(() => {
    if (pendingNote) {
      setNote(pendingNote);
      setPendingNote(null);
    }
  }, [pendingNote, setPendingNote]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDoneMsg(null);
    setShareHint(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;

  async function copyShareCart() {
    const token = encodePedidoCart(items, note);
    if (!token) {
      setShareHint('El pedido es muy grande para compartirlo por enlace.');
      return;
    }
    const path = buildPedidoSharePath(slug, token);
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
    try {
      await navigator.clipboard.writeText(url);
      setShareHint('Enlace copiado. Quien lo abra ve el mismo pedido.');
    } catch {
      setShareHint(url);
    }
  }

  async function sendOrder() {
    if (!items.length || busy) return;
    setBusy(true);
    setError(null);
    setDoneMsg(null);
    setDoneShareUrl(null);
    try {
      const res = await fetch(`/api/business/${encodeURIComponent(slug)}/orders`, {
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
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        orderNumber?: string;
        waUrl?: string;
        orderId?: string;
        shareUrl?: string;
        sharePath?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || 'No se pudo crear el pedido. Intenta de nuevo.');
        return;
      }
      emitPvCommerceEvent({
        businessProfileId: businessId,
        eventType: 'order_created',
        metadata: { orderId: data.orderId, orderNumber: data.orderNumber },
      });
      clear();
      setNote('');
      const share =
        data.shareUrl ||
        (data.sharePath && typeof window !== 'undefined'
          ? `${window.location.origin}${data.sharePath}`
          : data.sharePath) ||
        null;
      if (data.waUrl) {
        window.location.href = data.waUrl;
        return;
      }
      setDoneShareUrl(share);
      setDoneMsg(
        data.orderNumber
          ? `Pedido ${data.orderNumber} registrado. El negocio te contactará.`
          : 'Pedido registrado. El negocio te contactará.'
      );
    } catch {
      setError('Sin conexión. Revisa tu red e intenta otra vez.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pv-sheet" role="presentation">
      <button
        type="button"
        className="pv-sheet__scrim"
        aria-label="Cerrar pedido"
        onClick={() => setOpen(false)}
      />
      <div
        className="pv-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="pv-sheet__head">
          <h2 id={titleId} className="pv-sheet__title">
            {count > 0 ? `Tu pedido · ${count}` : 'Tu pedido'}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="pv-sheet__close"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="pv-sheet__body">
          {doneMsg ? (
            <div className="pv-cart-empty">
              <p className="pv-cart-empty__title">Listo</p>
              <p className="pv-cart-empty__text">{doneMsg}</p>
              {doneShareUrl ? (
                <button
                  type="button"
                  className="pv-cart-share"
                  onClick={() => {
                    void navigator.clipboard?.writeText(doneShareUrl).then(() => {
                      setShareHint('Enlace del pedido copiado');
                    });
                  }}
                >
                  Copiar enlace del pedido
                </button>
              ) : null}
              {shareHint ? <p className="pv-cart-hint">{shareHint}</p> : null}
              <button
                type="button"
                className="pv-barra-accion__primary"
                style={{ width: '100%', border: 'none', marginTop: 12 }}
                onClick={() => setOpen(false)}
              >
                Seguir viendo
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="pv-cart-empty">
              <p className="pv-cart-empty__title">Aún vacío</p>
              <p className="pv-cart-empty__text">
                Elige productos del catálogo y agrégalos. Luego los envías al negocio por
                WhatsApp en un solo mensaje.
              </p>
              <a
                href="#catalogo"
                className="pv-barra-accion__primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  marginTop: 12,
                }}
                onClick={() => setOpen(false)}
              >
                Ver productos
              </a>
            </div>
          ) : (
            <>
              <ul className="pv-cart-list">
                {items.map((i) => (
                  <li key={i.productId} className="pv-cart-row">
                    {i.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={i.imageUrl}
                        alt=""
                        width={56}
                        height={56}
                        className="pv-cart-row__img"
                      />
                    ) : (
                      <div className="pv-cart-row__ph" aria-hidden />
                    )}
                    <div className="pv-cart-row__meta">
                      <p className="pv-cart-row__name">{i.title}</p>
                      <p className="pv-cart-row__price">
                        {i.price != null ? formatPen(i.price) : 'Precio a consultar'}
                      </p>
                      <div className="pv-qty">
                        <button
                          type="button"
                          className="pv-qty__btn"
                          aria-label="Quitar uno"
                          onClick={() => setQty(i.productId, i.qty - 1)}
                        >
                          −
                        </button>
                        <span className="pv-qty__val" aria-live="polite">
                          {i.qty}
                        </span>
                        <button
                          type="button"
                          className="pv-qty__btn"
                          aria-label="Agregar uno"
                          onClick={() => setQty(i.productId, i.qty + 1)}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="pv-cart-row__remove"
                          onClick={() => removeItem(i.productId)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <p className="pv-cart-row__sub">
                      {i.price != null ? formatPen(i.price * i.qty) : '—'}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="pv-cart-footer">
                <p className="pv-cart-total">
                  Total <strong>{formatPen(total)}</strong>
                </p>
                <label className="pv-cart-note">
                  <span>Nota para el negocio (opcional)</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Ej. delivery a…, talla M, llego a las 7…"
                  />
                </label>
                {error ? <p className="pv-cart-error">{error}</p> : null}
                <button
                  type="button"
                  className="pv-barra-accion__primary pv-cart-send"
                  disabled={busy || !phone}
                  onClick={() => void sendOrder()}
                >
                  {busy ? 'Preparando…' : sendLabel}
                </button>
                <button
                  type="button"
                  className="pv-cart-share"
                  disabled={busy}
                  onClick={() => void copyShareCart()}
                >
                  Compartir pedido (enlace)
                </button>
                {shareHint ? <p className="pv-cart-hint">{shareHint}</p> : null}
                {!phone ? (
                  <p className="pv-cart-hint">
                    Este negocio aún no configuró WhatsApp. Puedes guardar el pedido y volver
                    más tarde.
                  </p>
                ) : (
                  <p className="pv-cart-hint">
                    Se abre WhatsApp con tu lista lista para enviar. Sin registro.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Toast “Agregado” sin robar el scroll. */
export function PvCartToast() {
  const { toast, clearToast, setOpen, count } = usePvCart();
  if (!toast) return null;
  return (
    <div className="pv-toast" role="status">
      <p className="pv-toast__text">
        <strong>Agregado</strong> · {toast}
      </p>
      <button
        type="button"
        className="pv-toast__action"
        onClick={() => {
          clearToast();
          setOpen(true);
        }}
      >
        Ver pedido{count > 0 ? ` (${count})` : ''}
      </button>
    </div>
  );
}
