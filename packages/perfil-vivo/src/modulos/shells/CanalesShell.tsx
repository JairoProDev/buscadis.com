'use client';

import { usePerfil } from '../PerfilContext';

export function CanalesShell() {
  const { payload } = usePerfil();
  const { contacto } = payload.negocio;
  const links: { label: string; href: string }[] = [];

  if (contacto.web) links.push({ label: 'Web', href: contacto.web });
  for (const r of contacto.redes) {
    if (!r.activa) continue;
    links.push({
      label: r.tipo.slice(0, 1).toUpperCase() + r.tipo.slice(1),
      href: r.url,
    });
  }

  if (!links.length) return null;

  return (
    <section className="pv-modulo" id="canales">
      <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        Canales y redes
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {links.map((l) => (
          <a
            key={l.href + l.label}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            style={{
              minWidth: 44,
              minHeight: 44,
              padding: '0 12px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 'var(--rd-full)',
              border: '1px solid var(--bd-soft)',
              textDecoration: 'none',
              color: 'var(--mk-texto)',
              font: 'var(--ts-meta)',
            }}
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}
