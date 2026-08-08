'use client';

import { usePerfil } from '../PerfilContext';

/**
 * Hybrid 3.0 — única pastilla de estado vivo
 * (Abierto · hasta / Responde / Delivery). No duplicar en hero.
 */
export function EstadoShell() {
  const { payload } = usePerfil();
  const e = payload.estadoVivo;
  const tone = e.abierto ? (e.porCerrar ? 'warn' : 'ok') : 'err';

  const bits: string[] = [];
  if (e.abierto) {
    bits.push(e.porCerrar ? 'Por cerrar' : 'Abierto ahora');
    if (e.cierraEn) bits.push(`hasta ${e.cierraEn}`);
  } else {
    bits.push('Cerrado');
    if (e.abreEn) bits.push(`abre ${e.abreEn}`);
  }
  if (e.respuestaMedianaMin != null && e.respuestaMedianaMin > 0) {
    bits.push(`Responde ~${e.respuestaMedianaMin} min`);
  }
  if (e.deliveryActivo) bits.push('Delivery activo');

  return (
    <section className="pv-modulo" id="estado" aria-live="polite">
      <div className={`pv-estado pv-estado--${tone}`}>
        <span
          aria-hidden
          className={e.abierto ? 'pv-estado-dot pv-estado-dot--on' : 'pv-estado-dot'}
        />
        <span>
          {bits.map((b, i) => (
            <span key={`${i}-${b}`}>
              {i > 0 ? <span className="pv-estado__sep"> · </span> : null}
              {b}
            </span>
          ))}
        </span>
      </div>
    </section>
  );
}
