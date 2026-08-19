'use client';

import { usePerfil } from './PerfilContext';
import { useChromeUI } from './ChromeUIContext';
import { usePvCartOptional } from '../commerce/CartContext';
import { emitPvCommerceEvent } from '../commerce/cart';

function IconShare() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 5l7 7-7 7M21 12H9M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6h15l-1.5 9h-12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.4" fill="currentColor" />
      <circle cx="17" cy="20" r="1.4" fill="currentColor" />
      <path d="M6 6L5 3H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BarraAccion({ label }: { label: string }) {
  const { handoffs, payload } = usePerfil();
  const { openMas } = useChromeUI();
  const cart = usePvCartOptional();
  const href = handoffs.whatsappPrimary;
  const count = cart?.count ?? 0;

  return (
    <div className="pv-barra-accion">
      <button
        type="button"
        className="pv-barra-accion__icon"
        aria-label={count ? `Pedido (${count})` : 'Ver pedido'}
        onClick={() => cart?.setOpen(true)}
      >
        <IconCart />
        {count > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: 'var(--wa, #25d366)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
              padding: '0 4px',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>
      {href ? (
        <a
          href={href}
          className="pv-barra-accion__primary"
          onClick={() => {
            emitPvCommerceEvent({
              businessProfileId: payload.negocio.id,
              eventType: 'purchase_intent',
              metadata: { surface: 'sticky_wa' },
            });
          }}
        >
          {label}
        </a>
      ) : (
        <button type="button" className="pv-barra-accion__primary" disabled>
          {label}
        </button>
      )}
      <button
        type="button"
        className="pv-barra-accion__icon"
        aria-label="Compartir y más opciones"
        onClick={openMas}
      >
        <IconShare />
      </button>
    </div>
  );
}
