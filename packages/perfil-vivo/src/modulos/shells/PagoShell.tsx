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
  bcp: 'BCP',
  interbank: 'Interbank',
  bbva: 'BBVA',
  scotiabank: 'Scotiabank',
  banbif: 'BanBif',
};

const ICONS: Record<MetodoPago, string> = {
  efectivo: '/perfil-vivo/pago/efectivo.png',
  yape: '/perfil-vivo/pago/yape-tile.png',
  plin: '/perfil-vivo/pago/plin-tile.png',
  visa: '/perfil-vivo/pago/visa.png',
  mastercard: '/perfil-vivo/pago/mastercard.png',
  amex: '/perfil-vivo/pago/amex.png',
  transferencia: '/perfil-vivo/pago/transferencia.png',
  credito: '/perfil-vivo/pago/credito.png',
  cripto: '/perfil-vivo/pago/cripto.png',
  bcp: '/perfil-vivo/pago/bcp.png',
  interbank: '/perfil-vivo/pago/interbank.png',
  bbva: '/perfil-vivo/pago/bbva.png',
  scotiabank: '/perfil-vivo/pago/scotiabank.png',
  banbif: '/perfil-vivo/pago/banbif.png',
};

const ORDEN: MetodoPago[] = [
  'visa',
  'mastercard',
  'amex',
  'yape',
  'plin',
  'bcp',
  'interbank',
  'bbva',
  'scotiabank',
  'banbif',
  'transferencia',
  'efectivo',
  'credito',
  'cripto',
];

const BANCOS: MetodoPago[] = ['bcp', 'interbank', 'bbva', 'scotiabank', 'banbif'];

function ordenar(metodos: MetodoPago[]): MetodoPago[] {
  const set = new Set(metodos);
  // Si hay bancos específicos, no mostrar el ícono genérico "transferencia"
  if (BANCOS.some((b) => set.has(b))) set.delete('transferencia');
  const ordered = ORDEN.filter((m) => set.has(m));
  for (const m of metodos) {
    if (set.has(m) && !ordered.includes(m)) ordered.push(m);
  }
  return ordered;
}

function resumen(metodos: MetodoPago[]): string {
  const set = new Set(metodos);
  const bits: string[] = [];
  if (set.has('efectivo')) bits.push('Efectivo');
  if (['visa', 'mastercard', 'amex', 'credito'].some((m) => set.has(m as MetodoPago))) {
    bits.push('Tarjetas');
  }
  if (set.has('yape')) bits.push('Yape');
  if (set.has('plin')) bits.push('Plin');
  if (BANCOS.some((b) => set.has(b)) || set.has('transferencia')) bits.push('Transferencia');
  if (set.has('cripto')) bits.push('Cripto');
  return bits.join(' · ');
}

export function PagoShell() {
  const { payload } = usePerfil();
  const metodos = ordenar(payload.negocio.metodosPago ?? []);
  if (!metodos.length) return null;

  return (
    <section className="pv-modulo" id="pago">
      <div className="pv-panel">
        <h2 style={{ margin: '0 0 14px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
          Métodos de pago
        </h2>
        <ul className="pv-pago">
          {metodos.map((m) => (
            <li key={m} className="pv-pago__tile" title={LABELS[m]}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ICONS[m]}
                alt={LABELS[m]}
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="pv-pago__img"
              />
              <span className="pv-pago__sr">{LABELS[m]}</span>
            </li>
          ))}
        </ul>
        <p className="pv-pago__resumen">{resumen(metodos)}</p>
      </div>
    </section>
  );
}
