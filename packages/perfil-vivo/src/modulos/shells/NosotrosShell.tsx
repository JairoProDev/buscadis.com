'use client';

import { useState } from 'react';
import { usePerfil } from '../PerfilContext';

/** §18 — Quiénes somos: colapsado, dos líneas + Leer más; eslogan vive aquí. */
export function NosotrosShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const nosotros = payload.nosotros;
  const [abierto, setAbierto] = useState(false);

  if (!nosotros?.texto?.trim()) return null;

  const texto = nosotros.texto.trim();
  const corto = texto.length <= 140;
  const visible = abierto || corto ? texto : `${texto.slice(0, 140).trim()}…`;

  return (
    <section className="pv-modulo" id="nosotros">
      <h2 style={{ margin: '0 0 10px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Quiénes somos'}
      </h2>
      {nosotros.eslogan && (
        <p
          style={{
            margin: '0 0 8px',
            font: 'var(--ts-cuerpo)',
            fontWeight: 600,
            color: 'var(--tx-base)',
          }}
        >
          {nosotros.eslogan}
        </p>
      )}
      <p
        style={{
          margin: 0,
          font: 'var(--ts-cuerpo)',
          color: 'var(--tx-muted)',
          lineHeight: 1.45,
        }}
      >
        {visible}
      </p>
      {!corto && (
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          style={{
            marginTop: 8,
            minHeight: 44,
            padding: '0 4px',
            border: 'none',
            background: 'transparent',
            color: 'var(--mk-accion)',
            font: 'var(--ts-meta)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {abierto ? 'Ver menos' : 'Leer más'}
        </button>
      )}
    </section>
  );
}
