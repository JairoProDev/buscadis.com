'use client';

import { usePerfil } from '../PerfilContext';

type Stat = { key: string; valor: string; label: string; icon: 'star' | 'clock' | 'years' | 'box' | 'users' };

function Icon({ type }: { type: Stat['icon'] }) {
  if (type === 'star') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 3.6l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.1 7.2 18.5l.9-5.4L4.2 9.3l5.4-.8L12 3.6z" />
      </svg>
    );
  }
  if (type === 'clock') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'years') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'users') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M3.5 19c.8-2.8 3-4.5 5.5-4.5S13.7 16.2 14.5 19M13 14.6c1.4-.6 3-.4 4.3.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5L12 4l8 4.5v7L12 20l-8-4.5v-7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 12v8M4 8.5l8 3.5 8-3.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** Franja de datos reales (nunca inventa “+18K clientes”). */
export function MetricasShell() {
  const { payload } = usePerfil();
  const { negocio, metricas, totalProductos } = payload;
  const stats: Stat[] = [];

  if (metricas?.calificacion && metricas.calificacion.total > 0) {
    stats.push({
      key: 'rating',
      valor: metricas.calificacion.promedio.toFixed(1),
      label: `${metricas.calificacion.total} opiniones`,
      icon: 'star',
    });
  }

  if (metricas?.respuestaMedianaMin != null && metricas.respuestaMedianaMin > 0) {
    stats.push({
      key: 'resp',
      valor: `~${metricas.respuestaMedianaMin} min`,
      label: 'Responde',
      icon: 'clock',
    });
  }

  for (const d of negocio.metricasDeclaradas.slice(0, 2)) {
    stats.push({
      key: `decl-${d.etiqueta}`,
      valor: d.valor,
      label: d.etiqueta,
      icon: /año/i.test(d.etiqueta) ? 'years' : 'users',
    });
  }

  if (stats.length < 4 && totalProductos > 0) {
    stats.push({
      key: 'prod',
      valor: String(totalProductos),
      label: totalProductos === 1 ? 'Producto' : 'Productos',
      icon: 'box',
    });
  }

  if (!stats.length) return null;

  const shown = stats.slice(0, 4);

  return (
    <section
      className="pv-modulo pv-stats"
      id="metricas"
      aria-label="Valoraciones y datos del negocio"
    >
      <ul className="pv-stats__row">
        {shown.map((s) => (
          <li key={s.key} className="pv-stats__item">
            <span className="pv-stats__icon" aria-hidden>
              <Icon type={s.icon} />
            </span>
            <span className="pv-stats__valor">{s.valor}</span>
            <span className="pv-stats__label">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
