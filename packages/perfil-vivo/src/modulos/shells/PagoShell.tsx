'use client';

import type { MetodoPago } from '../../types';
import { usePerfil } from '../PerfilContext';

const LABELS: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  cripto: 'Cripto',
};

export function PagoShell() {
  const { payload } = usePerfil();
  const metodos = payload.negocio.metodosPago ?? [];
  if (!metodos.length) return null;

  return (
    <section className="pv-modulo" id="pago">
      <div className="pv-panel">
        <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
          Métodos de pago
        </h2>
        <ul className="pv-pago">
          {metodos.map((m) => (
            <li key={m} className="pv-pago__chip">
              {LABELS[m]}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
