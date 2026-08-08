'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Producto } from '../../types';
import { formatPrecio } from '../../estado/calcular-estado';
import { usePerfil } from '../PerfilContext';

const SHEET_KEY = 'pv-servicio';

/**
 * Hybrid 3.0 — servicios tipo tienda: precio dominante + sheet con history.
 */
export function ServiciosShell({ titulo }: { titulo: string }) {
  const { payload, handoffs } = usePerfil();
  const arq = payload.negocio.arquetipo;
  const servicios = payload.productos
    .filter((p) => {
      if (!p.activo) return false;
      if (arq === 'alto_ticket') return p.grupo === 'Servicios';
      return true;
    })
    .slice(0, 12);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = servicios.find((p) => p.id === openId) ?? null;
  const total = servicios.length;

  const closeSheet = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.state?.pvSheet === SHEET_KEY) {
      window.history.back();
      return;
    }
    setOpenId(null);
  }, []);

  const openSheet = useCallback((id: string) => {
    setOpenId(id);
    if (typeof window === 'undefined') return;
    window.history.pushState({ pvSheet: SHEET_KEY, id }, '');
  }, []);

  useEffect(() => {
    const onPop = () => setOpenId(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (servicios.length < 2) return null;

  return (
    <section className="pv-modulo" id="servicios">
      <div className="pv-store-head">
        <h2 className="pv-store-head__title">{titulo || 'Servicios'}</h2>
        <a className="pv-store-head__link" href="#servicios">
          Ver los {total} →
        </a>
      </div>
      <ul className="pv-servicios-list">
        {servicios.map((s) => (
          <li key={s.id}>
            <button type="button" className="pv-servicio-row" onClick={() => openSheet(s.id)}>
              <div style={{ minWidth: 0 }}>
                <p className="pv-servicio-row__nombre">{s.nombre}</p>
                {s.descripcion ? (
                  <p className="pv-servicio-row__desc">{s.descripcion}</p>
                ) : null}
                <span className="pv-card-producto__cta" style={{ marginTop: 8 }}>
                  Consultar
                </span>
              </div>
              {s.precio ? (
                <p className="pv-servicio-row__precio">
                  {s.precio.tipo === 'desde' ? 'Desde ' : ''}
                  {formatPrecio(s.precio.valor, s.precio.moneda)}
                </p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <ServicioSheet
          servicio={open}
          handoffUrl={handoffs.productoWhatsapp[open.id] ?? handoffs.whatsappPrimary}
          onClose={closeSheet}
        />
      ) : null}
    </section>
  );
}

function ServicioSheet({
  servicio,
  handoffUrl,
  onClose,
}: {
  servicio: Producto;
  handoffUrl: string | null;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={servicio.nombre}
      className="pv-sheet-scrim"
      onClick={onClose}
    >
      <div className="pv-sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 28 }}>
        <h3 className="pv-sheet__title" style={{ marginTop: 4 }}>
          {servicio.nombre}
        </h3>
        {servicio.precio ? (
          <p className="pv-sheet__precio">
            {servicio.precio.tipo === 'desde' ? 'Desde ' : ''}
            {formatPrecio(servicio.precio.valor, servicio.precio.moneda)}
          </p>
        ) : null}
        {servicio.descripcion ? (
          <p className="pv-sheet__desc" style={{ color: 'var(--tx-muted)', marginBottom: 16 }}>
            {servicio.descripcion}
          </p>
        ) : null}
        {handoffUrl ? (
          <a
            href={handoffUrl}
            className="pv-barra-accion__primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              minHeight: 52,
            }}
          >
            Agendar por WhatsApp
          </a>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 10,
            width: '100%',
            minHeight: 44,
            border: 'none',
            background: 'transparent',
            fontWeight: 600,
            color: 'var(--tx-muted)',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
