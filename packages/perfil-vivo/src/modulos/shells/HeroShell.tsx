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
  const meta = `${negocio.categoria.nombre} · ${distrito}`;
  const nivel = negocio.verificacion.nivel;
  const portada = negocio.identidad.portadaUrl;
  const criterio = CRITERIOS[nivel];

  function iniciales(nombre: string): string {
    const parts = nombre.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'B';
  }

  return (
    <header className="pv-modulo" id="identidad">
      <div
        style={{
          marginLeft: 'calc(-1 * var(--sp-4))',
          marginRight: 'calc(-1 * var(--sp-4))',
        }}
      >
        <div
          style={{
            height: 150,
            background: portada
              ? `center/cover url(${portada})`
              : 'var(--mk-suave)',
            backgroundImage: portada
              ? undefined
              : 'radial-gradient(circle at 20% 30%, rgba(19,18,24,.06), transparent 50%)',
            position: 'relative',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, transparent 0%, rgba(0,0,0,.55) 85%)',
            }}
          />
        </div>
        <div
          style={{
            padding: '0 var(--sp-4)',
            marginTop: -32,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--rd-lg)',
              border: '2px solid var(--sf-elev)',
              background: negocio.identidad.logoUrl
                ? `center/cover url(${negocio.identidad.logoUrl})`
                : 'var(--mk-accion)',
              color: 'var(--mk-sobre)',
              display: 'grid',
              placeItems: 'center',
              font: '700 22px/1 var(--ff-display)',
              flexShrink: 0,
            }}
            aria-hidden
          >
            {!negocio.identidad.logoUrl ? iniciales(negocio.nombre) : null}
          </div>
          <div style={{ paddingBottom: 8, minWidth: 0 }}>
            <h1
              style={{
                font: 'var(--ts-nombre)',
                color: 'var(--tx-strong)',
                margin: '0 0 4px',
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <span>{negocio.nombre}</span>
              {nivel >= 1 ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  title={criterio?.titulo}
                  aria-label={`Verificación: ${criterio?.titulo}`}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    background: nivel >= 2 ? 'var(--bs-chicha)' : 'var(--tx-muted)',
                    color: '#fff',
                    fontSize: 11,
                    lineHeight: '18px',
                    cursor: 'pointer',
                  }}
                >
                  ✓
                </button>
              ) : null}
            </h1>
            <p
              style={{
                font: 'var(--ts-meta)',
                color: 'var(--tx-muted)',
                margin: 0,
              }}
            >
              {meta}
            </p>
          </div>
        </div>
      </div>

      {open && criterio ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pv-verif-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(19,18,24,.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              background: 'var(--sf-elev)',
              borderRadius: 'var(--rd-xl) var(--rd-xl) 0 0',
              padding: 20,
              paddingBottom: 32,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="pv-verif-title"
              style={{ margin: '0 0 8px', font: 'var(--ts-modulo)' }}
            >
              Qué significa esta verificación
            </h2>
            <p style={{ margin: '0 0 14px', font: 'var(--ts-cuerpo)', color: 'var(--tx-muted)' }}>
              En Buscadis el sello solo aparece si se cumplió un criterio público. No es un badge
              decorativo.
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {([1, 2, 3] as const).map((n) => {
                const c = CRITERIOS[n];
                const activo = nivel >= n;
                return (
                  <li
                    key={n}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--rd-md)',
                      border: `1px solid ${activo ? 'var(--mk-borde)' : 'var(--sf-line)'}`,
                      background: activo ? 'var(--mk-suave)' : 'var(--sf-base)',
                      opacity: activo ? 1 : 0.72,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        font: 'var(--ts-cuerpo)',
                        fontWeight: 700,
                        color: 'var(--tx-strong)',
                      }}
                    >
                      Nivel {n} · {c.titulo}
                      {nivel === n ? ' · actual' : ''}
                    </p>
                    <p style={{ margin: '4px 0 0', font: 'var(--ts-meta)', color: 'var(--tx-muted)' }}>
                      {c.texto}
                    </p>
                  </li>
                );
              })}
            </ul>
            {negocio.verificacion.fecha ? (
              <p style={{ margin: '14px 0 0', font: 'var(--ts-meta)', color: 'var(--tx-muted)' }}>
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
              style={{
                marginTop: 16,
                minHeight: 48,
                width: '100%',
                border: 'none',
                borderRadius: 'var(--rd-md)',
                background: 'var(--mk-accion)',
                color: 'var(--mk-sobre)',
                font: 'var(--ts-card)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
