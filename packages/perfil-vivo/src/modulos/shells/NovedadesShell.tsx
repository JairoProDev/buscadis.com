'use client';

import { useState } from 'react';
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

/** Visual 2.0 — story rings cuando hay imagen; cards si no. */
export function NovedadesShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const items = payload.novedades;
  const [activo, setActivo] = useState<number | null>(null);
  if (items.length < 1) return null;

  const conFoto = items.filter((n) => n.imagenUrl).slice(0, 8);
  const useRings = conFoto.length >= 2;

  return (
    <section className="pv-modulo" id="novedades">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Novedades'}
      </h2>

      {useRings ? (
        <div className="pv-highlights">
          {conFoto.map((n, i) => {
            const reciente =
              Date.now() - Date.parse(n.publicadaEn) < 24 * 3_600_000;
            return (
              <button
                key={n.id}
                type="button"
                className="pv-highlights__item"
                onClick={() => setActivo(i)}
              >
                <div
                  className={
                    reciente ? 'pv-highlights__ring' : 'pv-highlights__ring pv-highlights__ring--muted'
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={n.imagenUrl}
                    alt=""
                    width={68}
                    height={68}
                    className="pv-highlights__photo"
                    loading="lazy"
                  />
                </div>
                <p className="pv-highlights__label">{n.titulo}</p>
              </button>
            );
          })}
        </div>
      ) : (
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
                borderRadius: 'var(--rd-lg)',
                background: 'var(--sf-elev)',
                overflow: 'hidden',
                boxShadow: 'var(--el-2)',
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
                <div style={{ height: 80, background: 'var(--mk-suave)' }} />
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
      )}

      {activo != null && conFoto[activo] ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={conFoto[activo].titulo}
          onClick={() => setActivo(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(19,18,24,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={conFoto[activo].imagenUrl}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              borderRadius: 'var(--rd-lg)',
              objectFit: 'contain',
            }}
          />
          <p
            style={{
              margin: '16px 0 0',
              color: '#fff',
              font: 'var(--ts-cuerpo)',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {conFoto[activo].titulo}
          </p>
          {conFoto[activo].texto ? (
            <p
              style={{
                margin: '8px 0 0',
                color: 'rgba(255,255,255,0.75)',
                font: 'var(--ts-meta)',
                textAlign: 'center',
                maxWidth: 360,
              }}
            >
              {conFoto[activo].texto}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setActivo(null)}
            style={{
              marginTop: 20,
              minHeight: 44,
              padding: '0 20px',
              border: 'none',
              borderRadius: 'var(--rd-md)',
              background: '#fff',
              color: 'var(--tx-strong)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      ) : null}
    </section>
  );
}
