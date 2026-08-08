'use client';

import type { MetodoPago } from '../../types';
import { usePerfil } from '../PerfilContext';

const LABELS: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  visa: 'Visa',
  mastercard: 'MC',
  amex: 'Amex',
  transferencia: 'Transfer.',
  credito: 'Crédito',
  cripto: 'Cripto',
};

export function PagoShell() {
  const { payload } = usePerfil();
  const metodos = payload.negocio.metodosPago ?? [];
  if (!metodos.length) return null;

  return (
    <section className="pv-modulo" id="pago">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        Métodos de pago
      </h2>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {metodos.map((m) => (
          <span
            key={m}
            style={{
              width: 56,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 6,
              border: '1px solid var(--bd-soft)',
              background: 'var(--sf-elev)',
              font: 'var(--ts-etiqueta)',
              color: 'var(--tx-base)',
              textTransform: 'none',
              letterSpacing: 0,
            }}
            title={LABELS[m]}
          >
            {LABELS[m]}
          </span>
        ))}
      </div>
    </section>
  );
}
