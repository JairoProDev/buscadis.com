'use client';

import { usePerfil } from './PerfilContext';

export function BarraAccion({ label }: { label: string }) {
  const { handoffs } = usePerfil();
  const href = handoffs.whatsappPrimary;

  return (
    <div className="pv-barra-accion">
      {href ? (
        <a
          href={href}
          className="pv-barra-accion__primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
          }}
        >
          {label}
        </a>
      ) : (
        <button type="button" className="pv-barra-accion__primary" disabled>
          {label}
        </button>
      )}
    </div>
  );
}
