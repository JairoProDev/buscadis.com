'use client';

import { usePerfil } from '../PerfilContext';

export function EstadoShell() {
  const { payload } = usePerfil();
  const e = payload.estadoVivo;
  const color = e.abierto
    ? e.porCerrar
      ? 'var(--warn)'
      : 'var(--ok)'
    : 'var(--err)';

  const bits = [e.mensaje];
  if (e.respuestaMedianaMin != null && e.respuestaMedianaMin > 0) {
    bits.push(`Responde en ~${e.respuestaMedianaMin} min`);
  }
  if (e.deliveryActivo) bits.push('Delivery activo');

  return (
    <section
      className="pv-modulo"
      id="estado"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 32,
        font: 'var(--ts-meta)',
        color: 'var(--tx-base)',
      }}
    >
      <span
        aria-hidden
        className={e.abierto ? 'pv-estado-dot pv-estado-dot--on' : 'pv-estado-dot'}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      <span>
        {bits.map((b, i) => (
          <span key={`${i}-${b}`}>
            {i > 0 ? <span style={{ color: 'var(--tx-faint)' }}> · </span> : null}
            {b}
          </span>
        ))}
      </span>
    </section>
  );
}
