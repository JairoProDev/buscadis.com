import type { Negocio } from '../../types';

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

export function MetricasShell({ negocio }: { negocio: Negocio }) {
  return (
    <section
      className="pv-modulo"
      id="metricas"
      aria-label="Métricas de confianza"
      style={{
        font: 'var(--ts-cuerpo)',
        color: 'var(--tx-base)',
      }}
    >
      <p style={{ margin: 0 }}>{desdeLabel(negocio.creadoEn)}</p>
    </section>
  );
}
