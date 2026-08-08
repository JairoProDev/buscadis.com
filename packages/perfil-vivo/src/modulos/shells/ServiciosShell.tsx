'use client';

import { useState } from 'react';
import type { Producto } from '../../types';
import { formatPrecio } from '../../estado/calcular-estado';
import { usePerfil } from '../PerfilContext';

/**
 * §7b — Servicios y precios (arquetipo cita / profesional).
 * Card sin foto obligatoria; "Desde S/"; duración; CTA agendar por WA.
 */
export function ServiciosShell({ titulo }: { titulo: string }) {
  const { payload, handoffs } = usePerfil();
  const servicios = payload.productos.filter((p) => p.activo).slice(0, 12);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = servicios.find((p) => p.id === openId) ?? null;

  if (servicios.length < 2) return null;

  return (
    <section className="pv-modulo" id="servicios">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Servicios y precios'}
      </h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {servicios.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setOpenId(s.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                minHeight: 72,
                padding: '14px 16px',
                borderRadius: 'var(--rd-md)',
                border: '1px solid var(--sf-line)',
                background: 'var(--sf-elev)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      font: 'var(--ts-cuerpo)',
                      fontWeight: 700,
                      color: 'var(--tx-strong)',
                    }}
                  >
                    {s.nombre}
                  </p>
                  {s.descripcion ? (
                    <p
                      style={{
                        margin: '4px 0 0',
                        font: 'var(--ts-meta)',
                        color: 'var(--tx-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {s.descripcion}
                    </p>
                  ) : null}
                </div>
                {s.precio ? (
                  <p
                    style={{
                      margin: 0,
                      flexShrink: 0,
                      font: 'var(--ts-precio)',
                      fontFamily: 'var(--ff-data)',
                      color: 'var(--tx-strong)',
                    }}
                  >
                    {s.precio.tipo === 'desde' ? 'Desde ' : ''}
                    {formatPrecio(s.precio.valor, s.precio.moneda)}
                  </p>
                ) : null}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <ServicioSheet
          servicio={open}
          handoffUrl={handoffs.productoWhatsapp[open.id] ?? handoffs.whatsappPrimary}
          onClose={() => setOpenId(null)}
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
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(19,18,24,.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--sf-elev)',
          borderRadius: 'var(--rd-xl) var(--rd-xl) 0 0',
          padding: 20,
          paddingBottom: 28,
        }}
      >
        <h3 style={{ margin: '0 0 8px', font: 'var(--ts-modulo)' }}>{servicio.nombre}</h3>
        {servicio.precio ? (
          <p style={{ margin: '0 0 12px', font: 'var(--ts-precio-lg)' }}>
            {servicio.precio.tipo === 'desde' ? 'Desde ' : ''}
            {formatPrecio(servicio.precio.valor, servicio.precio.moneda)}
          </p>
        ) : null}
        {servicio.descripcion ? (
          <p style={{ margin: '0 0 16px', font: 'var(--ts-cuerpo)', color: 'var(--tx-muted)' }}>
            {servicio.descripcion}
          </p>
        ) : null}
        {handoffUrl ? (
          <a
            href={handoffUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 52,
              borderRadius: 'var(--rd-md)',
              background: 'var(--mk-accion)',
              color: 'var(--mk-sobre)',
              fontWeight: 700,
              textDecoration: 'none',
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
