'use client';

import { usePerfil } from '../PerfilContext';

function fechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

/** §19 lite — Artículos / notas del profesional (pro). */
export function PublicacionesShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const items = payload.publicaciones;
  if (items.length < 1) return null;

  return (
    <section className="pv-modulo" id="publicaciones">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Publicaciones'}
      </h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {items.slice(0, 6).map((p) => {
          const inner = (
            <>
              <p style={{ margin: 0, font: 'var(--ts-cuerpo)', fontWeight: 700, color: 'var(--tx-strong)' }}>
                {p.titulo}
              </p>
              {p.resumen ? (
                <p
                  style={{
                    margin: '4px 0 0',
                    font: 'var(--ts-meta)',
                    color: 'var(--tx-muted)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.resumen}
                </p>
              ) : null}
              <p style={{ margin: '6px 0 0', font: 'var(--ts-meta)', color: 'var(--tx-faint)' }}>
                {fechaCorta(p.publicadaEn)}
              </p>
            </>
          );
          const style = {
            display: 'block' as const,
            padding: '14px 16px',
            borderRadius: 'var(--rd-md)',
            border: '1px solid var(--sf-line)',
            background: 'var(--sf-elev)',
            textDecoration: 'none' as const,
            color: 'inherit',
          };
          return (
            <li key={p.id}>
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={style}>
                  {inner}
                </a>
              ) : (
                <div style={style}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
