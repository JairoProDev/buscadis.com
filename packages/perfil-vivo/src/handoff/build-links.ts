import type { PerfilPayload } from '../types';
import type { HandoffLinks } from '../modulos/PerfilContext';
import { formatPrecio } from '../estado/calcular-estado';
import { esPromocionVigente } from '../promo/vigente';
import {
  mensajeWhatsAppPreguntaIa,
  sugerenciasDesdePerfil,
} from '../ia/sugerencias';
import {
  crearHandoffLlamada,
  crearHandoffRuta,
  crearHandoffWhatsApp,
  mensajeWhatsAppProducto,
  mensajeWhatsAppPromo,
} from './token';

/** Solo servidor / RSC — usa node:crypto vía token.ts */
export function buildHandoffLinks(payload: PerfilPayload): HandoffLinks {
  const { negocio, productos, promocion } = payload;
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

  const promoViva = esPromocionVigente(promocion);
  const iaSugerencias: Record<string, string> = {};
  if (negocio.contacto.whatsapp) {
    for (const s of sugerenciasDesdePerfil(payload)) {
      iaSugerencias[s.id] = crearHandoffWhatsApp({
        negocioId: negocio.id,
        slug: negocio.slug,
        phone: negocio.contacto.whatsapp,
        nombre: negocio.nombre,
        modulo: 'ia',
        mensaje: mensajeWhatsAppPreguntaIa(negocio.nombre, s.pregunta),
      });
    }
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
    promocionWhatsapp:
      promoViva && negocio.contacto.whatsapp && promocion
        ? crearHandoffWhatsApp({
            negocioId: negocio.id,
            slug: negocio.slug,
            phone: negocio.contacto.whatsapp,
            nombre: negocio.nombre,
            modulo: 'promocion',
            mensaje: mensajeWhatsAppPromo(
              negocio.nombre,
              promocion.titulo,
              promocion.codigo
            ),
          })
        : null,
    iaSugerencias,
  };
}
