'use client';

import { usePerfil } from '../PerfilContext';

/** §18 lite — Certificaciones / credenciales (pro). */
export function CertificacionesShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const items = payload.certificaciones;
  if (items.length < 1) return null;

  return (
    <section className="pv-modulo" id="certificaciones">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Certificaciones'}
      </h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {items.slice(0, 8).map((c) => (
          <li
            key={c.id}
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--rd-md)',
              border: '1px solid var(--sf-line)',
              background: 'var(--sf-elev)',
            }}
          >
            <p style={{ margin: 0, font: 'var(--ts-cuerpo)', fontWeight: 700, color: 'var(--tx-strong)' }}>
              {c.titulo}
            </p>
            <p style={{ margin: '4px 0 0', font: 'var(--ts-meta)', color: 'var(--tx-muted)' }}>
              {[c.emisor, c.anio].filter(Boolean).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
