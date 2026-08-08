'use client';

import { usePerfil } from '../PerfilContext';

/**
 * Pastilla de estado — complementa el “Abierto ahora” del hero
 * con horario / respuesta / delivery.
 */
export function EstadoShell() {
  const { payload } = usePerfil();
  const e = payload.estadoVivo;
  const tone = e.abierto ? (e.porCerrar ? 'warn' : 'ok') : 'err';

  const bits: string[] = [];
  // Evitar repetir solo “Abierto/Cerrado” si el hero ya lo muestra
  if (e.mensaje && !/^(abierto|cerrado)\b/i.test(e.mensaje.trim())) {
    bits.push(e.mensaje);
  } else if (e.abierto && e.cierraEn) {
    bits.push(`Hasta las ${e.cierraEn}`);
  } else if (!e.abierto && e.abreEn) {
    bits.push(`Abre a las ${e.abreEn}`);
  } else {
    bits.push(e.mensaje);
  }

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
