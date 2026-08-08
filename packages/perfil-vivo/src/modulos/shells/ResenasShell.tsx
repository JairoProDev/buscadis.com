'use client';

import { usePerfil } from '../PerfilContext';
import {
  colorFromNombre,
  distribuirEstrellas,
  fechaRelativa,
  promedioEstrellas,
} from '../../resenas/helpers';

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} de 5 estrellas`} style={{ color: 'var(--bs-sol)' }}>
      {'★'.repeat(n)}
      <span style={{ color: 'var(--tx-faint)' }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export function ResenasShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const resenas = payload.resenas;
  if (resenas.length < 1) return null;

  const promedio =
    payload.metricas?.calificacion?.promedio ?? promedioEstrellas(resenas);
  const total = payload.metricas?.calificacion?.total ?? resenas.length;
  const dist =
    payload.metricas?.calificacion?.distribucion ?? distribuirEstrellas(resenas);
  const maxBar = Math.max(1, ...([1, 2, 3, 4, 5] as const).map((k) => dist[k] ?? 0));

  return (
    <section className="pv-modulo" id="resenas">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 44,
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
          {titulo || 'Reseñas'}
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 16,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: '0 0 auto' }}>
          <p
            style={{
              margin: 0,
              font: 'var(--ts-precio-lg)',
              fontFamily: 'var(--ff-data)',
              color: 'var(--tx-strong)',
            }}
          >
            {promedio.toFixed(1)}
          </p>
          <p style={{ margin: '4px 0 0', font: 'var(--ts-meta)', color: 'var(--tx-muted)' }}>
            {total} reseña{total === 1 ? '' : 's'}
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = dist[star] ?? 0;
            const pct = (count / maxBar) * 100;
            return (
              <div
                key={star}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                  font: 'var(--ts-meta)',
                }}
              >
                <span style={{ width: 12, color: 'var(--tx-muted)' }}>{star}</span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--sf-sunk)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'var(--bs-sol)',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 20,
                    textAlign: 'right',
                    fontFamily: 'var(--ff-data)',
                    color: 'var(--tx-faint)',
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          marginLeft: 'calc(-1 * var(--sp-4))',
          marginRight: 'calc(-1 * var(--sp-4))',
          paddingLeft: 'var(--sp-4)',
          paddingRight: 40,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {resenas.slice(0, 12).map((r) => (
          <article key={r.id} className="pv-resena-card">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div
                aria-hidden
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: colorFromNombre(r.autor.nombre),
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  font: '600 14px/1 var(--ff-ui)',
                  flexShrink: 0,
                }}
              >
                {r.autor.iniciales}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    font: 'var(--ts-card)',
                    color: 'var(--tx-strong)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.autor.nombre}
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Stars n={r.estrellas} />
                  <span style={{ font: 'var(--ts-meta)', color: 'var(--tx-faint)' }}>
                    {fechaRelativa(r.creadaEn)}
                  </span>
                </div>
              </div>
            </div>
            {r.texto ? (
              <p
                style={{
                  margin: '10px 0 0',
                  font: 'var(--ts-cuerpo)',
                  color: 'var(--tx-base)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {r.texto}
              </p>
            ) : null}
            {r.contactoVerificado ? (
              <p
                style={{
                  margin: '8px 0 0',
                  font: 'var(--ts-meta)',
                  color: 'var(--mk-texto)',
                }}
              >
                Contacto verificado por Buscadis
              </p>
            ) : null}
            {r.respuesta ? (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 'var(--rd-sm)',
                  background: 'var(--mk-suave)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 4px',
                    font: 'var(--ts-etiqueta)',
                    color: 'var(--mk-texto)',
                    textTransform: 'uppercase',
                  }}
                >
                  Respuesta del negocio
                </p>
                <p
                  style={{
                    margin: 0,
                    font: 'var(--ts-meta)',
                    color: 'var(--tx-base)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {r.respuesta.texto}
                </p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
