'use client';

import { usePerfil } from '../PerfilContext';

const MESES = [
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

function desdeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'En Buscadis';
  return `En Buscadis desde ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export function MetricasShell() {
  const { payload } = usePerfil();
  const { negocio, metricas } = payload;
  const parts: string[] = [];

  if (metricas?.calificacion && metricas.calificacion.total > 0) {
    parts.push(
      `★ ${metricas.calificacion.promedio.toFixed(1)} (${metricas.calificacion.total})`
    );
  }

  if (metricas?.respuestaMedianaMin != null && metricas.respuestaMedianaMin > 0) {
    parts.push(`Responde en ~${metricas.respuestaMedianaMin} min`);
  }

  if (parts.length === 0) {
    parts.push(desdeLabel(metricas?.antiguedadDesde ?? negocio.creadoEn));
  }

  const declared = negocio.metricasDeclaradas.slice(0, 2);

  return (
    <section
      className="pv-modulo"
      id="metricas"
      aria-label="Valoraciones y datos del negocio"
      style={{ font: 'var(--ts-cuerpo)', color: 'var(--tx-base)' }}
    >
      <p style={{ margin: 0 }}>
        {parts.map((p, i) => (
          <span key={p}>
            {i > 0 ? (
              <span style={{ color: 'var(--tx-faint)' }}> · </span>
            ) : null}
            {p}
          </span>
        ))}
      </p>
      {declared.length > 0 ? (
        <p
          style={{
            margin: '6px 0 0',
            font: 'var(--ts-meta)',
            color: 'var(--tx-muted)',
          }}
        >
          {declared.map((d, i) => (
            <span key={d.etiqueta}>
              {i > 0 ? ' · ' : ''}
              {d.valor} {d.etiqueta}
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}
