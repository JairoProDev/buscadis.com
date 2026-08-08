'use client';

import { usePerfil } from '../PerfilContext';
import { colorFromNombre } from '../../resenas/helpers';

/** §20 lite — Equipo (cita / profesional). Cards 112px. */
export function EquipoShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const equipo = payload.equipo;
  if (equipo.length < 1) return null;

  return (
    <section className="pv-modulo" id="equipo">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Equipo'}
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
        {equipo.slice(0, 8).map((m) => (
          <article
            key={m.id}
            style={{
              flex: '0 0 112px',
              width: 112,
              scrollSnapAlign: 'start',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 112,
                height: 112,
                borderRadius: 'var(--rd-md)',
                overflow: 'hidden',
                background: m.fotoUrl ? undefined : colorFromNombre(m.nombre),
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                font: '700 28px/1 var(--ff-display)',
              }}
            >
              {m.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.fotoUrl}
                  alt={m.nombre}
                  width={112}
                  height={112}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                m.nombre
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()
              )}
            </div>
            <p
              style={{
                margin: '8px 0 0',
                font: 'var(--ts-meta)',
                fontWeight: 700,
                color: 'var(--tx-strong)',
              }}
            >
              {m.nombre}
            </p>
            <p style={{ margin: '2px 0 0', font: 'var(--ts-meta)', color: 'var(--tx-muted)' }}>
              {m.rol}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
