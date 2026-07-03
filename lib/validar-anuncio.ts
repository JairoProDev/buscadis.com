/**
 * Validaciones Pre-Insert para Anuncios
 * 
 * Valida que un anuncio cumpla con todos los requisitos antes de insertarlo en la BD
 */

import { Adiso, Categoria, TamañoPaquete, ContactoMultiple } from '@/types';
import { validarDescripcionSinContactos } from './limpiar-contactos';
import { validarUbicacionCusco } from './geocoding';

/**
 * Categorías válidas
 */
const CATEGORIAS_VALIDAS: Categoria[] = [
  'empleos',
  'inmuebles',
  'vehiculos',
  'servicios',
  'productos',
  'eventos',
  'negocios',
  'comunidad'
];

/**
 * Tamaños válidos
 */
const TAMAÑOS_VALIDOS: TamañoPaquete[] = [
  'miniatura',
  'pequeño',
  'mediano',
  'grande',
  'gigante'
];

/**
 * Resultado de validación
 */
export interface ResultadoValidacion {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

/**
 * Valida el título de un anuncio
 * 
 * @param titulo - Título a validar
 * @returns Array de errores (vacío si es válido)
 */
function validarTitulo(titulo: string | undefined): string[] {
  const errores: string[] = [];

  if (!titulo || typeof titulo !== 'string') {
    errores.push('El título es requerido');
    return errores;
  }

  const tituloTrim = titulo.trim();

  if (tituloTrim.length < 3) {
    errores.push('El título debe tener al menos 3 caracteres');
  }

  if (tituloTrim.length > 100) {
    errores.push('El título no puede exceder 100 caracteres');
  }

  return errores;
}

/**
 * Valida la descripción de un anuncio
 * 
 * @param descripcion - Descripción a validar
 * @returns Array de errores (vacío si es válido)
 */
function validarDescripcion(descripcion: string | undefined): string[] {
  const errores: string[] = [];

  if (!descripcion || typeof descripcion !== 'string') {
    errores.push('La descripción es requerida');
    return errores;
  }

  const descripcionTrim = descripcion.trim();

  if (descripcionTrim.length < 10) {
    errores.push('La descripción debe tener al menos 10 caracteres');
  }

  if (descripcionTrim.length > 2000) {
    errores.push('La descripción no puede exceder 2000 caracteres');
  }

  // CRÍTICO: Verificar que no contenga información de contacto
  if (!validarDescripcionSinContactos(descripcionTrim)) {
    errores.push('La descripción no debe contener números de teléfono o emails');
  }

  return errores;
}

/**
 * Valida los contactos de un anuncio
 * 
 * @param contactos - Contactos a validar (puede ser string, array de ContactoMultiple, o undefined)
 * @returns Array de errores (vacío si es válido)
 */
function validarContactos(contactos: (ContactoMultiple | string)[] | string | undefined): string[] {
  const errores: string[] = [];

  if (!contactos) {
    errores.push('Se requiere al menos un contacto');
    return errores;
  }

  // Si es string, validar que sea válido
  if (typeof contactos === 'string') {
    if (contactos.trim().length < 6) {
      errores.push('El contacto debe tener al menos 6 caracteres');
    }
    return errores;
  }

  // Si es array, validar que tenga al menos uno
  if (Array.isArray(contactos)) {
    if (contactos.length === 0) {
      errores.push('Se requiere al menos un contacto');
    }

    // Validar cada contacto
    contactos.forEach((contacto, index) => {
      if (typeof contacto === 'string') {
        if (contacto.trim().length < 6) {
          errores.push(`Contacto ${index + 1} es inválido (muy corto)`);
        }
      } else if (typeof contacto === 'object' && contacto !== null) {
        if (!contacto.valor || contacto.valor.trim().length < 6) {
          errores.push(`Contacto ${index + 1} tiene un valor inválido`);
        }
        if (!contacto.tipo || !['telefono', 'whatsapp', 'email'].includes(contacto.tipo)) {
          errores.push(`Contacto ${index + 1} tiene un tipo inválido`);
        }
      }
    });
  }

  return errores;
}

/**
 * Valida la categoría de un anuncio
 * 
 * @param categoria - Categoría a validar
 * @returns Array de errores (vacío si es válido)
 */
function validarCategoria(categoria: Categoria | undefined): string[] {
  const errores: string[] = [];

  if (!categoria) {
    errores.push('La categoría es requerida');
    return errores;
  }

  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    errores.push(`La categoría "${categoria}" no es válida. Debe ser una de: ${CATEGORIAS_VALIDAS.join(', ')}`);
  }

  return errores;
}

/**
 * Valida el tamaño de un anuncio
 * 
 * @param tamaño - Tamaño a validar
 * @returns Array de errores (vacío si es válido)
 */
function validarTamaño(tamaño: TamañoPaquete | undefined): string[] {
  const errores: string[] = [];

  // El tamaño es opcional, pero si está presente debe ser válido
  if (tamaño && !TAMAÑOS_VALIDOS.includes(tamaño)) {
    errores.push(`El tamaño "${tamaño}" no es válido. Debe ser uno de: ${TAMAÑOS_VALIDOS.join(', ')}`);
  }

  return errores;
}

/**
 * Valida la ubicación de un anuncio
 * 
 * @param ubicacion - Ubicación a validar
 * @returns Array de errores (vacío si es válido)
 */
function validarUbicacion(ubicacion: any): string[] {
  const errores: string[] = [];

  if (!ubicacion) {
    errores.push('La ubicación es requerida');
    return errores;
  }

  // Si es string, es válido (compatibilidad hacia atrás)
  if (typeof ubicacion === 'string') {
    if (ubicacion.trim().length < 3) {
      errores.push('La ubicación debe tener al menos 3 caracteres');
    }
    return errores;
  }

  // Si es objeto UbicacionDetallada, validar estructura
  if (typeof ubicacion === 'object' && ubicacion !== null) {
    if (!validarUbicacionCusco(ubicacion)) {
      errores.push('La ubicación no es válida para Cusco');
    }

    if (!ubicacion.distrito) {
      errores.push('El distrito es requerido en la ubicación');
    }
  }

  return errores;
}

/**
 * Valida las fechas de un anuncio
 * 
 * @param fechaPublicacion - Fecha de publicación
 * @param fechaExpiracion - Fecha de expiración (opcional)
 * @returns Array de errores (vacío si es válido)
 */
function validarFechas(fechaPublicacion: string | undefined, fechaExpiracion?: string | undefined): string[] {
  const errores: string[] = [];

  if (!fechaPublicacion) {
    errores.push('La fecha de publicación es requerida');
    return errores;
  }

  // Validar formato de fecha
  const fechaPub = new Date(fechaPublicacion);
  if (isNaN(fechaPub.getTime())) {
    errores.push('La fecha de publicación tiene un formato inválido');
    return errores;
  }

  // Si hay fecha de expiración, validar que sea posterior a la de publicación
  if (fechaExpiracion) {
    const fechaExp = new Date(fechaExpiracion);
    if (isNaN(fechaExp.getTime())) {
      errores.push('La fecha de expiración tiene un formato inválido');
    } else if (fechaExp <= fechaPub) {
      errores.push('La fecha de expiración debe ser posterior a la fecha de publicación');
    }
  }

  return errores;
}

/**
 * Valida un anuncio completo antes de insertarlo en la BD
 * 
 * @param adiso - Anuncio a validar
 * @returns Resultado de validación con errores y advertencias
 */
export function validarAnuncio(adiso: Partial<Adiso>): ResultadoValidacion {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validar campos requeridos
  errores.push(...validarTitulo(adiso.titulo));
  errores.push(...validarDescripcion(adiso.descripcion));
  errores.push(...validarContactos(adiso.contactosMultiples || adiso.contacto));
  errores.push(...validarCategoria(adiso.categoria));
  errores.push(...validarTamaño(adiso.tamaño));
  errores.push(...validarUbicacion(adiso.ubicacion));
  errores.push(...validarFechas(adiso.fechaPublicacion, adiso.fechaExpiracion));

  // Validaciones adicionales (advertencias, no errores críticos)
  if (adiso.descripcion && adiso.descripcion.length < 50) {
    advertencias.push('La descripción es muy corta, considera agregar más detalles');
  }

  if (adiso.titulo && adiso.titulo.length > 80) {
    advertencias.push('El título es muy largo, considera acortarlo para mejor visualización');
  }

  // Validar que si es histórico, tenga los campos requeridos
  if (adiso.esHistorico) {
    if (!adiso.fuenteOriginal) {
      advertencias.push('Anuncio histórico sin fuente_original especificada');
    }
    if (!adiso.edicionNumero) {
      advertencias.push('Anuncio histórico sin edicion_numero especificada');
    }
    if (!adiso.fechaPublicacionOriginal) {
      advertencias.push('Anuncio histórico sin fecha_publicacion_original especificada');
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias
  };
}

/**
 * Valida y normaliza un anuncio antes de insertarlo
 * 
 * @param adiso - Anuncio a validar y normalizar
 * @returns Anuncio normalizado o null si no es válido
 */
export function validarYNormalizarAnuncio(adiso: Partial<Adiso>): Adiso | null {
  const validacion = validarAnuncio(adiso);

  if (!validacion.valido) {
    console.error('Anuncio inválido:', validacion.errores);
    return null;
  }

  // Normalizar campos
  const anuncioNormalizado: Adiso = {
    id: adiso.id || '',
    categoria: adiso.categoria!,
    titulo: adiso.titulo!.trim().substring(0, 100),
    descripcion: adiso.descripcion!.trim().substring(0, 2000),
    contacto: typeof adiso.contacto === 'string'
      ? adiso.contacto.trim()
      : (Array.isArray(adiso.contactosMultiples) && adiso.contactosMultiples.length > 0
        ? (typeof (adiso.contactosMultiples as any)[0] === 'string'
          ? (adiso.contactosMultiples as any)[0]
          : adiso.contactosMultiples[0].valor)
        : ''),
    ubicacion: adiso.ubicacion || 'Cusco, Cusco, Cusco',
    fechaPublicacion: adiso.fechaPublicacion || new Date().toISOString().split('T')[0],
    horaPublicacion: adiso.horaPublicacion || '00:00',
    tamaño: adiso.tamaño,
    esHistorico: adiso.esHistorico ?? false,
    estaActivo: adiso.estaActivo ?? true,
    fuenteOriginal: adiso.fuenteOriginal,
    edicionNumero: adiso.edicionNumero,
    fechaPublicacionOriginal: adiso.fechaPublicacionOriginal,
    contactosMultiples: adiso.contactosMultiples,
    fechaExpiracion: adiso.fechaExpiracion,
    imagenesUrls: adiso.imagenesUrls,
    imagenUrl: adiso.imagenUrl,
    esGratuito: adiso.esGratuito
  };

  return anuncioNormalizado;
}

/** Lenient validation for Publish Studio — only requires minimum content */
export function validarAnuncioStudio(adiso: Partial<Adiso>): ResultadoValidacion {
  const errores: string[] = [];
  const advertencias: string[] = [];

  const hasContent =
    Boolean(adiso.titulo?.trim()) ||
    Boolean(adiso.descripcion?.trim()) ||
    Boolean(adiso.imagenesUrls?.length || adiso.imagenUrl);

  if (!hasContent) {
    errores.push('Agrega al menos un título, descripción o imagen');
  }

  if (adiso.titulo && adiso.titulo.length > 120) {
    advertencias.push('El título se acortará a 120 caracteres');
  }

  if (adiso.descripcion && adiso.descripcion.length > 2000) {
    advertencias.push('La descripción se acortará a 2000 caracteres');
  }

  if (adiso.contacto) {
    errores.push(...validarContactos(adiso.contactosMultiples || adiso.contacto));
  }

  return { valido: errores.length === 0, errores, advertencias };
}




