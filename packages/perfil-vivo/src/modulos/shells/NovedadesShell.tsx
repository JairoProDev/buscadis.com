'use client';

import { usePerfil } from '../PerfilContext';

function fechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

/** §11 lite / P16 — novedades del negocio (sin feed social completo). */
export function NovedadesShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const items = payload.novedades;
  if (items.length < 1) return null;

  return (
    <section className="pv-modulo" id="novedades">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Novedades'}
      </h2>
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          marginInline: 'calc(-1 * var(--sp-4))',
          paddingInline: 'var(--sp-4)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.slice(0, 8).map((n) => (
          <article
            key={n.id}
            style={{
              flex: '0 0 204px',
              width: 204,
              scrollSnapAlign: 'start',
              borderRadius: 'var(--rd-md)',
              border: '1px solid var(--sf-line)',
              background: 'var(--sf-elev)',
              overflow: 'hidden',
            }}
          >
            {n.imagenUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={n.imagenUrl}
                alt=""
                width={204}
                height={120}
                loading="lazy"
                style={{ width: 204, height: 120, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  height: 80,
                  background: 'var(--mk-suave)',
                }}
              />
            )}
            <div style={{ padding: '10px 12px 12px' }}>
              <p
                style={{
                  margin: 0,
                  font: 'var(--ts-card)',
                  fontWeight: 700,
                  color: 'var(--tx-strong)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: 38,
                }}
              >
                {n.titulo}
              </p>
              <p style={{ margin: '6px 0 0', font: 'var(--ts-meta)', color: 'var(--tx-faint)' }}>
                {fechaCorta(n.publicadaEn)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
