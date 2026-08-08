'use client';

import { usePerfil } from '../PerfilContext';

/** §21 lite — Documentos públicos (ficha, CV, brochure). */
export function DocumentosShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const items = payload.documentos;
  if (items.length < 1) return null;

  return (
    <section className="pv-modulo" id="documentos">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Documentos'}
      </h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
        {items.slice(0, 8).map((d) => (
          <li key={d.id}>
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                minHeight: 48,
                padding: '12px 14px',
                borderRadius: 'var(--rd-md)',
                border: '1px solid var(--sf-line)',
                background: 'var(--sf-elev)',
                textDecoration: 'none',
                color: 'var(--tx-strong)',
                font: 'var(--ts-cuerpo)',
                fontWeight: 600,
              }}
            >
              <span>{d.titulo}</span>
              <span style={{ font: 'var(--ts-meta)', color: 'var(--mk-accion)', flexShrink: 0 }}>
                {d.tipo === 'pdf' ? 'PDF' : 'Abrir'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
