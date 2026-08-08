'use client';

import type { CSSProperties } from 'react';
import { usePerfil } from '../PerfilContext';

function QuickAction({
  href,
  label,
  disabled,
}: {
  href: string | null;
  label: string;
  disabled?: boolean;
}) {
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    minHeight: 44,
    gap: 4,
    textDecoration: 'none',
    color: 'var(--tx-base)',
    font: 'var(--ts-etiqueta)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    opacity: disabled ? 0.45 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  };
  if (!href || disabled) {
    return (
      <span style={style} aria-disabled>
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--rd-md)',
            border: '1px solid var(--bd-soft)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 18,
          }}
        >
          ·
        </span>
        {label}
      </span>
    );
  }
  return (
    <a href={href} style={style}>
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--rd-md)',
          border: '1px solid var(--bd-soft)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 18,
          color: 'var(--mk-texto)',
        }}
      >
        ·
      </span>
      {label}
    </a>
  );
}

export function AccionesShell() {
  const { handoffs, payload } = usePerfil();
  const cerrado = !payload.estadoVivo.abierto;

  return (
    <section className="pv-modulo" id="acciones" aria-label="Acciones rápidas">
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <QuickAction href={handoffs.llamada} label="Llamar" disabled={!handoffs.llamada} />
        <QuickAction href={handoffs.ruta} label="Cómo llegar" disabled={!handoffs.ruta} />
        <QuickAction href="#catalogo" label="Catálogo" />
        {handoffs.whatsappPrimary ? (
          <QuickAction
            href={handoffs.whatsappPrimary}
            label={cerrado ? 'Escribir' : 'WhatsApp'}
          />
        ) : (
          <QuickAction href={null} label="WhatsApp" disabled />
        )}
      </div>
    </section>
  );
}
