'use client';

import { usePerfil } from '../PerfilContext';

export function EstadoShell() {
  const { payload } = usePerfil();
  const e = payload.estadoVivo;
  const tone = e.abierto ? (e.porCerrar ? 'warn' : 'ok') : 'err';
  const color =
    tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : 'var(--err)';

  const bits = [e.mensaje];
  if (e.respuestaMedianaMin != null && e.respuestaMedianaMin > 0) {
    bits.push(`Responde en ~${e.respuestaMedianaMin} min`);
  }
  if (e.deliveryActivo) bits.push('Delivery activo');

  return (
    <section className="pv-modulo" id="estado" aria-live="polite">
      <div className={`pv-estado pv-estado--${tone}`}>
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
              {i > 0 ? <span style={{ opacity: 0.55 }}> · </span> : null}
              {b}
            </span>
          ))}
        </span>
      </div>
    </section>
  );
}
