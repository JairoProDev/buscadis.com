'use client';

import { useState } from 'react';
import type { Negocio } from '../../types';

const CRITERIOS: Record<number, { titulo: string; texto: string }> = {
  1: {
    titulo: 'Registrado',
    texto: 'Email o teléfono confirmados en Buscadis.',
  },
  2: {
    titulo: 'Verificado',
    texto: 'Identidad de negocio validada (RUC / domicilio comprobado).',
  },
  3: {
    titulo: 'Verificado en local',
    texto: 'Alguien del equipo ADIS visitó el local y tomó evidencia.',
  },
};

export function HeroShell({ negocio }: { negocio: Negocio }) {
  const [open, setOpen] = useState(false);
  const distrito = negocio.ubicacion?.distrito ?? 'Cusco';
  const meta = [negocio.categoria.nombre, distrito].filter(Boolean).join(' · ');
  const nivel = negocio.verificacion.nivel;
  const portada = negocio.identidad.portadaUrl;
  const criterio = CRITERIOS[nivel];

  function iniciales(nombre: string): string {
    const parts = nombre.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'B';
  }

  return (
    <header className="pv-modulo pv-hero" id="identidad">
      <div className="pv-hero__bleed">
        <div className="pv-hero__cover">
          {portada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portada}
              alt=""
              width={480}
              height={220}
              fetchPriority="high"
              decoding="async"
              className="pv-hero__cover-img"
            />
          ) : (
            <div className="pv-hero__cover-fallback" aria-hidden />
          )}
          <div className="pv-hero__cover-shade" aria-hidden />
        </div>

        <div className="pv-hero__identity">
          <div
            className="pv-hero__logo"
            style={{
              background: negocio.identidad.logoUrl
                ? 'var(--sf-elev)'
                : 'var(--mk-accion)',
              color: 'var(--mk-sobre)',
            }}
            aria-hidden
          >
            {negocio.identidad.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={negocio.identidad.logoUrl}
                alt=""
                width={72}
                height={72}
                fetchPriority="high"
                decoding="async"
              />
            ) : (
              <span className="pv-hero__iniciales">{iniciales(negocio.nombre)}</span>
            )}
          </div>
          <div className="pv-hero__titles">
            <h1>
              <span>{negocio.nombre}</span>
              {nivel >= 1 ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  title={criterio?.titulo}
                  aria-label={`Verificación: ${criterio?.titulo}`}
                  className="pv-hero__verif"
                  style={{
                    background: nivel >= 2 ? 'var(--bs-chicha)' : 'var(--tx-muted)',
                  }}
                >
                  ✓
                </button>
              ) : null}
            </h1>
            <p className="pv-hero__meta">{meta}</p>
          </div>
        </div>
      </div>

      {open && criterio ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pv-verif-title"
          className="pv-hero__dialog-scrim"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          <div className="pv-hero__dialog" onClick={(e) => e.stopPropagation()}>
            <h2 id="pv-verif-title">Qué significa esta verificación</h2>
            <p className="pv-hero__dialog-lead">
              En Buscadis el sello solo aparece si se cumplió un criterio público. No es un badge
              decorativo.
            </p>
            <ul className="pv-hero__criterios">
              {([1, 2, 3] as const).map((n) => {
                const c = CRITERIOS[n];
                const activo = nivel >= n;
                return (
                  <li key={n} className={activo ? 'is-activo' : undefined}>
                    <p className="pv-hero__criterio-titulo">
                      Nivel {n} · {c.titulo}
                      {nivel === n ? ' · actual' : ''}
                    </p>
                    <p className="pv-hero__criterio-texto">{c.texto}</p>
                  </li>
                );
              })}
            </ul>
            {negocio.verificacion.fecha ? (
              <p className="pv-hero__fecha">
                Verificado desde{' '}
                {new Date(negocio.verificacion.fecha).toLocaleDateString('es-PE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="pv-hero__dialog-close"
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
