'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Producto } from '../../types';
import { formatPrecio } from '../../estado/calcular-estado';
import { usePerfil } from '../PerfilContext';
import { MODULO_META, planSuficiente } from '../contrato';
import { usePvCartOptional } from '../../commerce/CartContext';
import { emitPvCommerceEvent } from '../../commerce/cart';

const ETIQUETA: Record<string, string> = {
  nuevo: 'Nuevo',
  mas_vendido: 'Más pedido',
  oferta: 'Oferta',
  popular: 'Popular',
};

const SHEET_KEY = 'pv-producto';

function precioLabel(p: Producto): string | null {
  if (!p.precio) return null;
  const base = formatPrecio(p.precio.valor, p.precio.moneda);
  if (p.precio.tipo === 'desde') return `Desde ${base}`;
  return base;
}

function ProductCard({
  producto,
  onOpen,
  cover,
  ctaLabel,
}: {
  producto: Producto;
  onOpen: () => void;
  cover?: boolean;
  ctaLabel: string;
}) {
  const agotado = producto.disponibilidad === 'agotado';
  const img = producto.imagenes[0];
  const etiqueta = producto.etiquetas[0];
  const precio = precioLabel(producto);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`pv-card-producto${agotado ? ' is-agotado' : ''}`}
    >
      <div className="pv-card-producto__img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img?.url}
          alt={img?.alt ?? producto.nombre}
          width={156}
          height={156}
          className={
            cover
              ? 'pv-card-producto__img'
              : 'pv-card-producto__img pv-card-producto__img--contain'
          }
        />
        {etiqueta ? (
          <span className="pv-badge">{ETIQUETA[etiqueta] ?? etiqueta}</span>
        ) : null}
        {agotado ? (
          <span className="pv-badge pv-badge--agotado">Agotado</span>
        ) : null}
      </div>
      <div className="pv-card-producto__body">
        {precio ? (
          <p className="pv-card-producto__precio">
            {precio}
            {producto.precioAnterior != null && producto.precio ? (
              <span className="pv-card-producto__precio-old">
                {formatPrecio(producto.precioAnterior, producto.precio.moneda)}
              </span>
            ) : null}
          </p>
        ) : null}
        <p className="pv-card-producto__nombre">{producto.nombre}</p>
        <span className="pv-card-producto__cta">{ctaLabel}</span>
      </div>
    </button>
  );
}

function ProductoSheet({
  producto,
  handoffUrl,
  productoHref,
  onClose,
  ctaLabel,
  onAdd,
  addLabel,
}: {
  producto: Producto;
  handoffUrl: string | null;
  productoHref: string;
  onClose: () => void;
  ctaLabel: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  const precio = precioLabel(producto);
  const img = producto.imagenes[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={producto.nombre}
      className="pv-sheet-scrim"
      onClick={onClose}
      onKeyDown={(ev) => {
        if (ev.key === 'Escape') onClose();
      }}
    >
      <div className="pv-sheet" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img?.url}
          alt={img?.alt ?? producto.nombre}
          width={480}
          height={320}
          className="pv-sheet__img"
        />
        <h3 className="pv-sheet__title">{producto.nombre}</h3>
        {precio ? <p className="pv-sheet__precio">{precio}</p> : null}
        {producto.descripcion ? (
          <p className="pv-sheet__desc">{producto.descripcion}</p>
        ) : null}
        <a href={productoHref} className="pv-sheet__link">
          Ver página del producto →
        </a>
        <div className="pv-sheet__bar" style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          {onAdd ? (
            <button
              type="button"
              className="pv-barra-accion__primary"
              style={{
                minHeight: 48,
                border: 'none',
                cursor: 'pointer',
                background: 'var(--mk-accion)',
              }}
              onClick={() => {
                onAdd();
                onClose();
              }}
            >
              {addLabel || 'Agregar al pedido'}
            </button>
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
                minHeight: 48,
                background: onAdd ? 'transparent' : undefined,
                color: onAdd ? 'var(--mk-accion)' : undefined,
                border: onAdd ? '1.5px solid var(--mk-accion)' : undefined,
              }}
              onClick={() => {
                /* purchase_intent tracked by parent open + handoff analytics */
              }}
            >
              {ctaLabel}
            </a>
          ) : (
            <button type="button" className="pv-barra-accion__primary" disabled>
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CatalogoShell({ titulo }: { titulo: string }) {
  const { payload, handoffs } = usePerfil();
  const cart = usePvCartOptional();
  const [grupo, setGrupo] = useState<string | null>(null);
  const destacados = payload.productos.filter((p) => p.activo && p.destacado);
  const totalActivos = payload.productos.filter((p) => p.activo).length;
  const productos = (
    grupo ? destacados.filter((p) => p.grupo === grupo) : destacados
  ).slice(0, 12);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = productos.find((p) => p.id === openId) ?? null;
  const slug = payload.negocio.slug;
  const arq = payload.negocio.arquetipo;
  const coverImgs =
    arq === 'comida' || arq === 'alto_ticket' || arq === 'local';
  const ctaCard = arq === 'comida' ? 'Pedir' : 'Consultar';
  const ctaSheet =
    arq === 'comida' ? 'Pedir solo este' : 'Consultar por WhatsApp';
  const addLabel = arq === 'comida' ? 'Agregar al pedido' : 'Agregar al pedido';
  const iaCfg = payload.negocio.modulos.find((m) => m.tipo === 'ia');
  const tieneIa =
    Boolean(iaCfg?.visible !== false) &&
    planSuficiente(payload.negocio.plan, MODULO_META.ia.planMin) &&
    (payload.negocio.conteos?.productos ?? payload.productos.length) >=
      MODULO_META.ia.minDatos;

  const closeSheet = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.state?.pvSheet === SHEET_KEY) {
      window.history.back();
      return;
    }
    setOpenId(null);
  }, []);

  const openSheet = useCallback(
    (id: string) => {
      setOpenId(id);
      emitPvCommerceEvent({
        businessProfileId: payload.negocio.id,
        eventType: 'product_view',
        productId: id,
      });
      emitPvCommerceEvent({
        businessProfileId: payload.negocio.id,
        eventType: 'purchase_intent',
        productId: id,
        metadata: { surface: 'catalogo_sheet' },
      });
      if (typeof window === 'undefined') return;
      window.history.pushState({ pvSheet: SHEET_KEY, id }, '');
    },
    [payload.negocio.id]
  );

  useEffect(() => {
    const onPop = () => setOpenId(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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

  const verN = Math.max(totalActivos, destacados.length);

  return (
    <section className="pv-modulo" id="catalogo">
      <div className="pv-store-head">
        <h2 className="pv-store-head__title">
          {titulo || 'Productos'}
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
            className="pv-store-head__link"
            style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
            onClick={() => {
              try {
                sessionStorage.removeItem('pv-grupo');
              } catch {
                /* ignore */
              }
              setGrupo(null);
            }}
          >
            Ver todos
          </button>
        ) : (
          <a
            className="pv-store-head__link"
            href={`/v/${encodeURIComponent(slug)}#catalogo`}
          >
            Ver los {verN} →
          </a>
        )}
      </div>
      <div className="pv-store-rail">
        {productos.map((p) => (
          <ProductCard
            key={p.id}
            producto={p}
            onOpen={() => openSheet(p.id)}
            cover={coverImgs}
            ctaLabel={ctaCard}
          />
        ))}
      </div>
      {tieneIa ? (
        <p style={{ margin: '12px 0 0', textAlign: 'center' }}>
          <a href="#ia" className="pv-store-head__link">
            Pregúntale al negocio →
          </a>
        </p>
      ) : null}
      {open ? (
        <ProductoSheet
          producto={open}
          handoffUrl={handoffs.productoWhatsapp[open.id] ?? null}
          productoHref={`/v/${encodeURIComponent(slug)}/producto/${encodeURIComponent(open.id)}`}
          onClose={closeSheet}
          ctaLabel={ctaSheet}
          addLabel={addLabel}
          onAdd={
            cart
              ? () => {
                  cart.addItem({
                    productId: open.id,
                    title: open.nombre,
                    price: open.precio?.valor,
                    imageUrl: open.imagenes[0]?.url,
                  });
                }
              : undefined
          }
        />
      ) : null}
    </section>
  );
}
