'use client';

import { usePerfil } from '../PerfilContext';

function canalClass(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('instagram') || l === 'ig') return 'pv-canales__item pv-canales__item--ig';
  if (l.includes('facebook') || l === 'fb') return 'pv-canales__item pv-canales__item--fb';
  if (l.includes('tiktok') || l === 'tt') return 'pv-canales__item pv-canales__item--tt';
  if (l.includes('youtube') || l === 'yt') return 'pv-canales__item pv-canales__item--yt';
  if (l === 'web') return 'pv-canales__item pv-canales__item--web';
  return 'pv-canales__item';
}

function canalShort(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('instagram')) return 'IG';
  if (l.includes('facebook')) return 'Fb';
  if (l.includes('tiktok')) return 'TT';
  if (l.includes('youtube')) return 'YT';
  if (l === 'web') return 'Web';
  return label.slice(0, 2).toUpperCase();
}

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
      <div className="pv-panel">
        <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
          Canales y redes
        </h2>
        <div className="pv-canales">
          {links.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className={canalClass(l.label)}
              title={l.label}
              aria-label={l.label}
            >
              {canalShort(l.label)}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
