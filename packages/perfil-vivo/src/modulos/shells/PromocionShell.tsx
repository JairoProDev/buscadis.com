'use client';

import { useMemo } from 'react';
import { usePerfil } from '../PerfilContext';
import { esPromocionVigente } from '../../promo/vigente';

function msRestantes(venceEn?: string, now = Date.now()): number | null {
  if (!venceEn) return null;
  const t = Date.parse(venceEn);
  if (!Number.isFinite(t)) return null;
  return t - now;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Venció';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 48) {
    const d = Math.ceil(h / 24);
    return `${d} día${d === 1 ? '' : 's'}`;
  }
  if (h >= 1) return `${h} h ${m} min`;
  return `${Math.max(1, m)} min`;
}

/** §9 — Una sola promoción vigente; banner Visual 2.0. */
export function PromocionShell({ titulo }: { titulo: string }) {
  const { payload, handoffs } = usePerfil();
  const promo = payload.promocion;

  const restante = useMemo(
    () => (promo ? msRestantes(promo.venceEn) : null),
    [promo]
  );

  if (!esPromocionVigente(promo)) return null;

  const showCountdown = restante != null && restante < 72 * 3_600_000;
  const href = handoffs.promocionWhatsapp || handoffs.whatsappPrimary;

  return (
    <section className="pv-modulo" id="promocion">
      <div className="pv-promo">
        <p className="pv-promo__eyebrow">{titulo || 'Promoción'}</p>
        <h2 className="pv-promo__title">{promo.titulo}</h2>
        {promo.condicion ? (
          <p style={{ margin: '8px 0 0', font: 'var(--ts-cuerpo)', color: 'var(--tx-muted)' }}>
            {promo.condicion}
          </p>
        ) : null}
        {promo.codigo ? (
          <p
            style={{
              margin: '10px 0 0',
              font: 'var(--ts-meta)',
              fontFamily: 'var(--ff-data)',
              color: 'var(--tx-base)',
            }}
          >
            Código: <strong>{promo.codigo}</strong>
          </p>
        ) : null}
        {showCountdown && restante != null ? (
          <p
            style={{
              margin: '8px 0 0',
              font: 'var(--ts-meta)',
              fontWeight: 700,
              color: 'var(--bs-chicha)',
            }}
          >
            Termina en {formatCountdown(restante)}
          </p>
        ) : null}
        {href ? (
          <a href={href} className="pv-promo__cta">
            {promo.ctaLabel || 'Pedir esta promo'}
          </a>
        ) : null}
      </div>
    </section>
  );
}
