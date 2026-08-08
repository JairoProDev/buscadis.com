import type { PerfilPayload } from '../types';
import type { HandoffLinks } from '../modulos/PerfilContext';
import { formatPrecio } from '../estado/calcular-estado';
import {
  crearHandoffLlamada,
  crearHandoffRuta,
  crearHandoffWhatsApp,
  mensajeWhatsAppProducto,
} from './token';

/** Solo servidor / RSC — usa node:crypto vía token.ts */
export function buildHandoffLinks(payload: PerfilPayload): HandoffLinks {
  const { negocio, productos } = payload;
  const productoWhatsapp: Record<string, string> = {};

  for (const p of productos) {
    if (!negocio.contacto.whatsapp) continue;
    const precio =
      p.precio != null
        ? formatPrecio(p.precio.valor, p.precio.moneda)
        : undefined;
    productoWhatsapp[p.id] = crearHandoffWhatsApp({
      negocioId: negocio.id,
      slug: negocio.slug,
      phone: negocio.contacto.whatsapp,
      nombre: negocio.nombre,
      modulo: 'catalogo',
      productoId: p.id,
      mensaje: mensajeWhatsAppProducto(negocio.nombre, p.nombre, precio),
    });
  }

  return {
    whatsappPrimary: negocio.contacto.whatsapp
      ? crearHandoffWhatsApp({
          negocioId: negocio.id,
          slug: negocio.slug,
          phone: negocio.contacto.whatsapp,
          nombre: negocio.nombre,
          modulo: 'barra',
        })
      : null,
    llamada: negocio.contacto.telefono
      ? crearHandoffLlamada({
          negocioId: negocio.id,
          slug: negocio.slug,
          phone: negocio.contacto.telefono,
          modulo: 'acciones',
        })
      : null,
    ruta: negocio.ubicacion
      ? crearHandoffRuta({
          negocioId: negocio.id,
          slug: negocio.slug,
          lat: negocio.ubicacion.lat,
          lng: negocio.ubicacion.lng,
          modulo: 'ubicacion',
        })
      : null,
    productoWhatsapp,
  };
}
