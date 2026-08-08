'use client';

import { useState } from 'react';
import { usePerfil } from '../PerfilContext';

/** §10 — Galería peek 136px + visor simple a pantalla completa. */
export function GaleriaShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const fotos = payload.galeria;
  const [activo, setActivo] = useState<number | null>(null);

  if (fotos.length < 3) return null;

  return (
    <section className="pv-modulo" id="galeria">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Galería'}
      </h2>
      <div
        className="pv-carousel"
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          marginInline: -16,
          paddingInline: 16,
          paddingBottom: 4,
        }}
      >
        {fotos.slice(0, 12).map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActivo(i)}
            aria-label={f.alt || `Foto ${i + 1}`}
            style={{
              flex: '0 0 136px',
              width: 136,
              height: 136,
              padding: 0,
              border: 'none',
              borderRadius: 'var(--rd-md)',
              overflow: 'hidden',
              scrollSnapAlign: 'start',
              cursor: 'pointer',
              background: 'var(--sf-muted)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f.url}
              alt={f.alt || ''}
              width={136}
              height={136}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        ))}
      </div>

      {activo != null && fotos[activo] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visor de galería"
          onClick={() => setActivo(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(19,18,24,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotos[activo].url}
            alt={fotos[activo].alt || ''}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '85vh',
              borderRadius: 'var(--rd-md)',
              objectFit: 'contain',
            }}
          />
          <button
            type="button"
            onClick={() => setActivo(null)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              minWidth: 44,
              minHeight: 44,
              borderRadius: 999,
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      )}
    </section>
  );
}
