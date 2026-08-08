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

/** §9 — Una sola promoción vigente; contador solo si faltan &lt;72 h. */
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
      <div
        style={{
          borderRadius: 'var(--rd-lg)',
          border: '1px solid var(--mk-borde)',
          background: 'var(--mk-suave)',
          padding: '16px 16px 14px',
        }}
      >
        <p
          style={{
            margin: 0,
            font: 'var(--ts-meta)',
            fontWeight: 700,
            color: 'var(--mk-texto)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {titulo || 'Promoción'}
        </p>
        <h2
          style={{
            margin: '6px 0 0',
            font: 'var(--ts-modulo)',
            color: 'var(--tx-strong)',
          }}
        >
          {promo.titulo}
        </h2>
        {promo.condicion && (
          <p style={{ margin: '8px 0 0', font: 'var(--ts-cuerpo)', color: 'var(--tx-muted)' }}>
            {promo.condicion}
          </p>
        )}
        {promo.codigo && (
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
        )}
        {showCountdown && restante != null && (
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
        )}
        {href && (
          <a
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 14,
              minHeight: 48,
              borderRadius: 'var(--rd-md)',
              background: 'var(--mk-accion)',
              color: 'var(--mk-sobre)',
              font: 'var(--ts-cuerpo)',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {promo.ctaLabel || 'Pedir esta promo'}
          </a>
        )}
      </div>
    </section>
  );
}
