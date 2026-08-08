'use client';

import { useState } from 'react';
import type { Negocio } from '../../types';
import { usePerfil } from '../PerfilContext';

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

function etiquetasHero(negocio: Negocio): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (raw?: string) => {
    const t = raw?.trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };
  for (const e of negocio.etiquetas ?? []) push(e);
  push(negocio.categoria?.nombre);
  return out.slice(0, 3);
}

function lugarCorto(u: NonNullable<Negocio['ubicacion']>): string {
  const ciudad = u.distrito || u.provincia;
  if (ciudad && u.provincia && ciudad !== u.provincia) {
    return `${ciudad}, ${u.provincia}`;
  }
  if (ciudad) return `${ciudad}, Perú`;
  return 'Perú';
}

export function HeroShell({ negocio }: { negocio: Negocio }) {
  const { payload } = usePerfil();
  const [open, setOpen] = useState(false);
  const nivel = negocio.verificacion.nivel;
  const portada = negocio.identidad.portadaUrl;
  const criterio = CRITERIOS[Math.max(nivel, 2)] ?? CRITERIOS[2];
  const verificado = mostrarSelloVerificado(negocio);
  const tags = etiquetasHero(negocio);
  const eslogan = negocio.eslogan?.trim() || null;
  const estado = payload.estadoVivo;
  const lugar = negocio.ubicacion ? lugarCorto(negocio.ubicacion) : null;
  const direccion =
    negocio.ubicacion?.mostrarDireccionExacta && negocio.ubicacion.direccion
      ? negocio.ubicacion.direccion.trim()
      : null;

  const metaRubro = tags.join(' • ');
  const estadoCorto = estado.abierto
    ? estado.porCerrar
      ? 'Por cerrar'
      : 'Abierto ahora'
    : 'Cerrado';
  const estadoTone = estado.abierto
    ? estado.porCerrar
      ? 'warn'
      : 'ok'
    : 'err';

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
              height={300}
              fetchPriority="high"
              decoding="async"
              className="pv-hero__cover-img"
            />
          ) : (
            <div className="pv-hero__cover-fallback" aria-hidden />
          )}
          <div className="pv-hero__cover-shade" aria-hidden />

          <div className="pv-hero__overlay">
            <div
              className="pv-hero__logo"
              style={{
                background: negocio.identidad.logoUrl
                  ? '#fff'
                  : 'var(--mk-accion)',
                color: 'var(--mk-sobre)',
              }}
            >
              {negocio.identidad.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={negocio.identidad.logoUrl}
                  alt={`Logo de ${negocio.nombre}`}
                  width={96}
                  height={96}
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
              {verificado ? (
                <button
                  type="button"
                  className="pv-hero__badge"
                  onClick={() => setOpen(true)}
                  aria-label={`Negocio verificado: ${criterio?.titulo}`}
                >
                  <span className="pv-hero__badge-check" aria-hidden>
                    ✓
                  </span>
                  Negocio verificado
                </button>
              ) : null}

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

              {metaRubro ? (
                <p className="pv-hero__meta">{metaRubro}</p>
              ) : null}

              <p className="pv-hero__lugar">
                {direccion || lugar ? (
                  <>
                    <span className="pv-hero__lugar-ico" aria-hidden>
                      ⌖
                    </span>
                    <span className="pv-hero__lugar-text">
                      {direccion ? `${direccion}` : null}
                      {direccion && lugar ? ' · ' : null}
                      {lugar}
                    </span>
                  </>
                ) : null}
                {(direccion || lugar) && estado ? (
                  <span className="pv-hero__sep" aria-hidden>
                    ·
                  </span>
                ) : null}
                <span
                  className={`pv-hero__open pv-hero__open--${estadoTone}`}
                >
                  {estadoCorto}
                </span>
              </p>
            </div>
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
