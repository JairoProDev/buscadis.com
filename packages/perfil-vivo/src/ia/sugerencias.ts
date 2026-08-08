import type { PerfilPayload, Producto } from '../types';
import { formatPrecio } from '../estado/calcular-estado';

export type SugerenciaIa = {
  id: string;
  pregunta: string;
  /** Respuesta solo con datos del perfil; null = no inventar, pasar a WA */
  respuesta: string | null;
};

function productoCoincide(p: Producto, q: string): boolean {
  const n = p.nombre.toLowerCase();
  const tokens = q
    .toLowerCase()
    .replace(/[¿?¡!]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 3);
  return tokens.some((t) => n.includes(t));
}

/** Tres sugerencias contextuales (§23) — solo datos reales del payload. */
export function sugerenciasDesdePerfil(payload: PerfilPayload): SugerenciaIa[] {
  const { negocio, productos, faqs, estadoVivo } = payload;
  const out: SugerenciaIa[] = [];
  const activos = productos.filter((p) => p.activo);

  if (activos[0]) {
    const p = activos[0];
    const precio = p.precio
      ? formatPrecio(p.precio.valor, p.precio.moneda)
      : null;
    out.push({
      id: `prod-${p.id}`,
      pregunta: `¿Tienen ${p.nombre}?`,
      respuesta: precio
        ? `En el catálogo de ${negocio.nombre} aparece «${p.nombre}» a ${
            p.precio?.tipo === 'desde' ? 'desde ' : ''
          }${precio}. La disponibilidad exacta conviene confirmarla por WhatsApp.`
        : `«${p.nombre}» figura en el catálogo de ${negocio.nombre}. Confirmá precio y stock por WhatsApp.`,
    });
  }

  if (negocio.horario || estadoVivo.mensaje) {
    out.push({
      id: 'horario',
      pregunta: '¿Cuál es el horario de hoy?',
      respuesta: estadoVivo.abierto
        ? `${negocio.nombre} está abierto ahora. ${estadoVivo.mensaje}`
        : `${negocio.nombre} está cerrado ahora. ${estadoVivo.mensaje}`,
    });
  }

  const faqDelivery = faqs.find((f) =>
    /delivery|envio|envío|reparto/i.test(f.pregunta + f.respuesta)
  );
  if (estadoVivo.deliveryActivo) {
    out.push({
      id: 'delivery',
      pregunta: `¿Hacen delivery en ${negocio.ubicacion?.distrito || 'Cusco'}?`,
      respuesta: `Según el perfil, ${negocio.nombre} tiene delivery activo. Confirmá zona y costo por WhatsApp.`,
    });
  } else if (faqDelivery) {
    out.push({
      id: 'delivery-faq',
      pregunta: faqDelivery.pregunta.startsWith('¿')
        ? faqDelivery.pregunta
        : `¿${faqDelivery.pregunta}?`,
      respuesta: faqDelivery.respuesta,
    });
  } else if (negocio.ubicacion) {
    out.push({
      id: 'ubicacion',
      pregunta: `¿Dónde están en ${negocio.ubicacion.distrito}?`,
      respuesta: negocio.ubicacion.mostrarDireccionExacta
        ? `${negocio.nombre} está en ${negocio.ubicacion.direccion}, ${negocio.ubicacion.distrito}. ${
            negocio.ubicacion.referencia
              ? `Referencia: ${negocio.ubicacion.referencia}.`
              : ''
          }`
        : `${negocio.nombre} atiende en ${negocio.ubicacion.distrito}. Pedí la referencia exacta por WhatsApp.`,
    });
  }

  // Rellenar hasta 3 con FAQ o segundo producto
  for (const f of faqs) {
    if (out.length >= 3) break;
    if (out.some((s) => s.pregunta === f.pregunta)) continue;
    out.push({
      id: `faq-${f.id}`,
      pregunta: f.pregunta.startsWith('¿') ? f.pregunta : `¿${f.pregunta}?`,
      respuesta: f.respuesta,
    });
  }

  if (out.length < 3 && activos[1]) {
    const p = activos[1];
    out.push({
      id: `prod-${p.id}`,
      pregunta: `¿Cuánto cuesta ${p.nombre}?`,
      respuesta: p.precio
        ? `En el perfil figura a ${p.precio.tipo === 'desde' ? 'desde ' : ''}${formatPrecio(
            p.precio.valor,
            p.precio.moneda
          )}. Confirmá stock por WhatsApp.`
        : `No hay precio publicado para «${p.nombre}». Preguntá por WhatsApp.`,
    });
  }

  return out.slice(0, 3);
}

/**
 * Responde solo con datos del perfil. null = no sabe → pasar a WhatsApp.
 * Nunca afirma stock ni negocia precios.
 */
export function responderPreguntaIa(
  payload: PerfilPayload,
  preguntaRaw: string
): string | null {
  const q = preguntaRaw.trim();
  if (q.length < 4) return null;

  const sugeridas = sugerenciasDesdePerfil(payload);
  const exact = sugeridas.find(
    (s) => s.pregunta.toLowerCase() === q.toLowerCase()
  );
  if (exact) return exact.respuesta;

  const { negocio, productos, faqs, estadoVivo } = payload;
  const low = q.toLowerCase();

  if (/horario|abiert|cierr|atienden hoy/.test(low)) {
    return estadoVivo.mensaje
      ? `${negocio.nombre}: ${estadoVivo.mensaje}`
      : null;
  }

  if (/d[oó]nde|ubicaci[oó]n|direcci[oó]n|queda/.test(low) && negocio.ubicacion) {
    return negocio.ubicacion.mostrarDireccionExacta
      ? `${negocio.nombre} está en ${negocio.ubicacion.direccion}, ${negocio.ubicacion.distrito}.`
      : `${negocio.nombre} atiende en ${negocio.ubicacion.distrito}. Pedí la referencia por WhatsApp.`;
  }

  if (/delivery|envio|envío|reparto/.test(low)) {
    if (estadoVivo.deliveryActivo) {
      return `El perfil indica delivery activo. Confirmá zona y costo con ${negocio.nombre} por WhatsApp.`;
    }
    const faq = faqs.find((f) =>
      /delivery|envio|envío|reparto/i.test(f.pregunta + f.respuesta)
    );
    return faq?.respuesta ?? null;
  }

  const match = productos.find((p) => p.activo && productoCoincide(p, q));
  if (match?.precio) {
    return `En el catálogo aparece «${match.nombre}» a ${
      match.precio.tipo === 'desde' ? 'desde ' : ''
    }${formatPrecio(match.precio.valor, match.precio.moneda)}. No puedo confirmar stock: escribilés por WhatsApp.`;
  }
  if (match) {
    return `«${match.nombre}» está en el catálogo. Preguntá precio y disponibilidad por WhatsApp.`;
  }

  const faqHit = faqs.find((f) => {
    const blob = (f.pregunta + ' ' + f.respuesta).toLowerCase();
    return q
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 4)
      .some((t) => blob.includes(t));
  });
  if (faqHit) return faqHit.respuesta;

  return null;
}

export function mensajeWhatsAppPreguntaIa(
  nombreNegocio: string,
  pregunta: string
): string {
  return `Hola, vi el perfil de ${nombreNegocio} en Buscadis. ${pregunta}`;
}
