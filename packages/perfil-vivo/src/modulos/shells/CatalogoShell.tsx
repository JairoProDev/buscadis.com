'use client';

import { useEffect, useState } from 'react';
import type { Producto } from '../../types';
import { formatPrecio } from '../../estado/calcular-estado';
import { usePerfil } from '../PerfilContext';
import { MODULO_META, planSuficiente } from '../contrato';

const ETIQUETA: Record<string, string> = {
  nuevo: 'Nuevo',
  mas_vendido: 'Más pedido',
  oferta: 'Oferta',
  popular: 'Popular',
};

function precioLabel(p: Producto): string | null {
  if (!p.precio) return null;
  const base = formatPrecio(p.precio.valor, p.precio.moneda);
  if (p.precio.tipo === 'desde') return `Desde ${base}`;
  return base;
}

function ProductCard({
  producto,
  onOpen,
}: {
  producto: Producto;
  onOpen: () => void;
}) {
  const agotado = producto.disponibilidad === 'agotado';
  const img = producto.imagenes[0];
  const etiqueta = producto.etiquetas[0];
  const precio = precioLabel(producto);

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        flex: '0 0 156px',
        width: 156,
        textAlign: 'left',
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        opacity: agotado ? 0.6 : 1,
        filter: agotado ? 'grayscale(1)' : undefined,
      }}
    >
      <div style={{ position: 'relative', width: 156, height: 156 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img?.url}
          alt={img?.alt ?? producto.nombre}
          width={156}
          height={156}
          style={{
            width: 156,
            height: 156,
            objectFit: 'contain',
            borderRadius: 'var(--rd-md)',
            background: 'var(--sf-sunk)',
            border: '1px solid var(--bd-hair)',
          }}
        />
        {etiqueta ? (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'var(--sf-elev)',
              color: 'var(--tx-strong)',
              font: 'var(--ts-etiqueta)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {ETIQUETA[etiqueta] ?? etiqueta}
          </span>
        ) : null}
        {agotado ? (
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              background: 'var(--err)',
              color: '#fff',
              font: 'var(--ts-etiqueta)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            Agotado
          </span>
        ) : null}
      </div>
      <p
        style={{
          margin: '8px 0 4px',
          font: 'var(--ts-card)',
          color: 'var(--tx-strong)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 48,
          lineHeight: '16px',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {producto.nombre}
      </p>
      {precio ? (
        <p style={{ margin: 0, font: 'var(--ts-precio)', color: 'var(--tx-strong)' }}>
          {precio}
          {producto.precioAnterior ? (
            <span
              style={{
                marginLeft: 6,
                font: 'var(--ts-meta)',
                color: 'var(--tx-faint)',
                textDecoration: 'line-through',
              }}
            >
              {formatPrecio(producto.precioAnterior)}
            </span>
          ) : null}
        </p>
      ) : null}
    </button>
  );
}

function ProductoSheet({
  producto,
  handoffUrl,
  productoHref,
  onClose,
}: {
  producto: Producto;
  handoffUrl: string | null;
  productoHref: string;
  onClose: () => void;
}) {
  const precio = precioLabel(producto);
  const img = producto.imagenes[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={producto.nombre}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(19,18,24,.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
      onKeyDown={(ev) => {
        if (ev.key === 'Escape') onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '92vh',
          overflow: 'auto',
          background: 'var(--sf-elev)',
          borderRadius: 'var(--rd-xl) var(--rd-xl) 0 0',
          padding: 16,
          paddingBottom: 88,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img?.url}
          alt={img?.alt ?? producto.nombre}
          width={480}
          height={320}
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            borderRadius: 'var(--rd-md)',
            background: 'var(--sf-sunk)',
          }}
        />
        <h3
          style={{
            margin: '16px 0 8px',
            font: 'var(--ts-modulo)',
            color: 'var(--tx-strong)',
          }}
        >
          {producto.nombre}
        </h3>
        {precio ? (
          <p style={{ margin: '0 0 12px', font: 'var(--ts-precio-lg)' }}>{precio}</p>
        ) : null}
        {producto.descripcion ? (
          <p style={{ margin: 0, font: 'var(--ts-cuerpo)', color: 'var(--tx-base)' }}>
            {producto.descripcion}
          </p>
        ) : null}
        <a
          href={productoHref}
          style={{
            display: 'inline-block',
            marginTop: 12,
            font: 'var(--ts-meta)',
            fontWeight: 700,
            color: 'var(--mk-accion)',
          }}
        >
          Ver página del producto →
        </a>
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            maxWidth: 480,
            margin: '0 auto',
            padding: 12,
            background: 'var(--sf-elev)',
            borderTop: '1px solid var(--bd-hair)',
          }}
        >
          {handoffUrl ? (
            <a
              href={handoffUrl}
              className="pv-barra-accion__primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                minHeight: 48,
              }}
            >
              Preguntar por este producto
            </a>
          ) : (
            <button type="button" className="pv-barra-accion__primary" disabled>
              Preguntar por este producto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CatalogoShell({ titulo }: { titulo: string }) {
  const { payload, handoffs } = usePerfil();
  const [grupo, setGrupo] = useState<string | null>(null);
  const destacados = payload.productos.filter((p) => p.activo && p.destacado);
  const productos = (
    grupo ? destacados.filter((p) => p.grupo === grupo) : destacados
  ).slice(0, 12);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = productos.find((p) => p.id === openId) ?? null;
  const slug = payload.negocio.slug;
  const iaCfg = payload.negocio.modulos.find((m) => m.tipo === 'ia');
  const tieneIa =
    Boolean(iaCfg?.visible !== false) &&
    planSuficiente(payload.negocio.plan, MODULO_META.ia.planMin) &&
    (payload.negocio.conteos?.productos ?? payload.productos.length) >=
      MODULO_META.ia.minDatos;

  useEffect(() => {
    const sync = () => {
      try {
        setGrupo(sessionStorage.getItem('pv-grupo'));
      } catch {
        setGrupo(null);
      }
    };
    sync();
    const onEvt = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      setGrupo(d || null);
    };
    window.addEventListener('pv-grupo', onEvt);
    return () => window.removeEventListener('pv-grupo', onEvt);
  }, []);

  if (destacados.length < 3) return null;

  return (
    <section className="pv-modulo" id="catalogo">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 44,
          marginBottom: 12,
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
          {titulo || 'Catálogo'}
          {grupo ? (
            <span style={{ font: 'var(--ts-meta)', color: 'var(--tx-muted)', fontWeight: 500 }}>
              {' '}
              · {grupo}
            </span>
          ) : null}
        </h2>
        {grupo ? (
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem('pv-grupo');
              } catch {
                /* ignore */
              }
              setGrupo(null);
            }}
            style={{
              border: 0,
              background: 'transparent',
              color: 'var(--mk-accion)',
              font: 'var(--ts-meta)',
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Ver todos
          </button>
        ) : null}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          marginLeft: 'calc(-1 * var(--sp-4))',
          marginRight: 'calc(-1 * var(--sp-4))',
          paddingLeft: 'var(--sp-4)',
          paddingRight: 48,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {productos.map((p) => (
          <div key={p.id} style={{ scrollSnapAlign: 'start' }}>
            <ProductCard producto={p} onOpen={() => setOpenId(p.id)} />
          </div>
        ))}
      </div>
      {tieneIa ? (
        <p style={{ margin: '12px 0 0', textAlign: 'center' }}>
          <a
            href="#ia"
            style={{
              font: 'var(--ts-meta)',
              fontWeight: 700,
              color: 'var(--mk-accion)',
              textDecoration: 'none',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Pregúntale al negocio →
          </a>
        </p>
      ) : null}
      {open ? (
        <ProductoSheet
          producto={open}
          handoffUrl={handoffs.productoWhatsapp[open.id] ?? null}
          productoHref={`/v/${encodeURIComponent(slug)}/producto/${encodeURIComponent(open.id)}`}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </section>
  );
}
