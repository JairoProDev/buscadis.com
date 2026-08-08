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
    texto: 'Negocio validado (RUC / domicilio comprobado).',
  },
  3: {
    titulo: 'Verificado en local',
    texto: 'Alguien del equipo ADIS visitó el local y tomó evidencia.',
  },
};

/** Sello visible solo si el plan es de pago y hay verificación de negocio. */
function mostrarSelloVerificado(negocio: Negocio): boolean {
  const pago = negocio.plan === 'pro' || negocio.plan === 'max';
  return pago && negocio.verificacion.nivel >= 2;
}

function metaLine(negocio: Negocio): string {
  const seen = new Set<string>();
  const bits: string[] = [];
  const push = (raw?: string) => {
    const t = raw?.trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    bits.push(t);
  };
  for (const e of (negocio.etiquetas ?? []).slice(0, 2)) push(e);
  push(negocio.categoria?.nombre);
  const ciudad = negocio.ubicacion?.distrito || negocio.ubicacion?.provincia;
  if (ciudad) push(ciudad);
  return bits.slice(0, 3).join(' • ');
}

/**
 * Hybrid 3.0 — masthead limpio: portada corta + identidad flotante
 * (logo circular solapado). Dirección exacta vive en Ubicación (SEO).
 */
export function HeroShell({ negocio }: { negocio: Negocio }) {
  const [open, setOpen] = useState(false);
  const nivel = negocio.verificacion.nivel;
  const portada = negocio.identidad.portadaUrl;
  const criterio = CRITERIOS[Math.max(nivel, 2)] ?? CRITERIOS[2];
  const verificado = mostrarSelloVerificado(negocio);
  const eslogan = negocio.eslogan?.trim() || null;
  const meta = metaLine(negocio);

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
              height={210}
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
              background: negocio.identidad.logoUrl ? '#fff' : 'var(--mk-accion)',
              color: 'var(--mk-sobre)',
            }}
          >
            {negocio.identidad.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={negocio.identidad.logoUrl}
                alt={`Logo de ${negocio.nombre}`}
                width={72}
                height={72}
                fetchPriority="high"
                decoding="async"
              />
            ) : (
              <span className="pv-hero__iniciales" aria-hidden>
                {iniciales(negocio.nombre)}
              </span>
            )}
          </div>

          <div className="pv-hero__copy">
            <h1 className="pv-hero__name">
              <span className="pv-hero__name-text">{negocio.nombre}</span>
              {verificado ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  title={criterio?.titulo}
                  aria-label={`Negocio verificado: ${criterio?.titulo}`}
                  className="pv-hero__verif"
                >
                  ✓
                </button>
              ) : null}
            </h1>
            {eslogan ? <p className="pv-hero__eslogan">{eslogan}</p> : null}
            {meta ? <p className="pv-hero__meta">{meta}</p> : null}
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
            <h2 id="pv-verif-title">Negocio verificado en Buscadis</h2>
            <p className="pv-hero__dialog-lead">
              El check solo aparece cuando el negocio tiene plan de pago y pasó una
              verificación real. No es un adorno.
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
