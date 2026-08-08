'use client';

import { usePerfil } from '../PerfilContext';

/**
 * Hybrid 3.0 — trust en una sola línea (06 §2).
 * Verificadas primero; declaradas tipográficamente más suaves.
 * Nunca inventa vanity (+18K).
 */
export function MetricasShell() {
  const { payload } = usePerfil();
  const { negocio, metricas } = payload;

  const verified: string[] = [];
  const declared: string[] = [];

  if (metricas?.calificacion && metricas.calificacion.total > 0) {
    verified.push(
      `★ ${metricas.calificacion.promedio.toFixed(1)} (${metricas.calificacion.total})`
    );
  }
  if (metricas?.respuestaMedianaMin != null && metricas.respuestaMedianaMin > 0) {
    verified.push(`Responde ~${metricas.respuestaMedianaMin} min`);
  }

  for (const d of negocio.metricasDeclaradas.slice(0, 2)) {
    declared.push(`${d.valor} ${d.etiqueta}`);
  }

  if (!verified.length && !declared.length) {
    const iso = metricas?.antiguedadDesde ?? negocio.creadoEn;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      const meses = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      verified.push(`En Buscadis desde ${meses[d.getMonth()]} ${d.getFullYear()}`);
    }
  }

  if (!verified.length && !declared.length) return null;

  return (
    <section
      className="pv-modulo pv-trust"
      id="metricas"
      aria-label="Valoraciones y datos del negocio"
    >
      <p className="pv-trust__line">
        {verified.map((p, i) => (
          <span key={p} className="pv-trust__verified">
            {i > 0 ? <span className="pv-trust__sep"> · </span> : null}
            {p}
          </span>
        ))}
        {declared.map((p, i) => (
          <span key={p} className="pv-trust__declared">
            {verified.length > 0 || i > 0 ? (
              <span className="pv-trust__sep"> · </span>
            ) : null}
            {p}
          </span>
        ))}
      </p>
    </section>
  );
}
