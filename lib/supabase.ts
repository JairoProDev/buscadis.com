import { createClient } from '@supabase/supabase-js';
import { Adiso, AdisoGratuito, AdisoPromotionTier, InteresAnuncioCaducado } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Faltan las variables de entorno de Supabase. Usando localStorage.');
}

// Crear cliente solo si tenemos las credenciales
// Habilitar persistencia de sesión para autenticación
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
  : null;

// Función para convertir de la base de datos a Adiso
export function dbToAdiso(row: any): Adiso {
  // Soporte para múltiples imágenes (array JSON) o imagen única (string)
  let imagenesUrls: string[] | undefined;
  if (row.imagenes_urls) {
    // Si es un array JSON
    try {
      imagenesUrls = typeof row.imagenes_urls === 'string'
        ? JSON.parse(row.imagenes_urls)
        : row.imagenes_urls;
    } catch {
      imagenesUrls = undefined;
    }
  } else if (row.imagen_url) {
    // Compatibilidad hacia atrás: imagen única
    imagenesUrls = [row.imagen_url];
  }

  // Manejar ubicación: si hay campos detallados, crear UbicacionDetallada, sino usar string
  let ubicacion: any = row.ubicacion; // Por defecto, usar el string de ubicación
  if (row.departamento && row.provincia && row.distrito) {
    // Si hay campos detallados, crear objeto UbicacionDetallada
    ubicacion = {
      pais: row.pais || 'Perú',
      departamento: row.departamento,
      provincia: row.provincia,
      distrito: row.distrito,
      direccion: row.direccion || undefined,
      latitud: row.latitud || undefined,
      longitud: row.longitud || undefined
    };
  }

  // Manejar contactos múltiples
  let contactosMultiples: any[] | undefined;
  if (row.contactos_multiples) {
    try {
      contactosMultiples = typeof row.contactos_multiples === 'string'
        ? JSON.parse(row.contactos_multiples)
        : row.contactos_multiples;
    } catch {
      contactosMultiples = undefined;
    }
  }

  return {
    id: row.id,
    categoria: row.categoria,
    titulo: row.titulo,
    descripcion: row.descripcion,
    contacto: row.contacto,
    ubicacion,
    fechaPublicacion: row.fecha_publicacion,
    horaPublicacion: row.hora_publicacion,
    tamaño: row.tamaño || 'miniatura',
    imagenesUrls,
    // Compatibilidad hacia atrás
    imagenUrl: imagenesUrls?.[0],
    // Nuevos campos
    fechaExpiracion: row.fecha_expiracion || undefined,
    estaActivo: row.esta_activo !== undefined ? row.esta_activo : true,
    esHistorico: row.es_historico !== undefined ? row.es_historico : false,
    fuenteOriginal: row.fuente_original || undefined,
    edicionNumero: row.edicion_numero || undefined,
    fechaPublicacionOriginal: row.fecha_publicacion_original || undefined,
    contactosMultiples: contactosMultiples || undefined,
    vistas: row.vistas || 0,
    contactos: row.contactos || 0,
    // Anuncios destacados/promocionados
    promotionTier: row.promotion_tier || 'gratis',
    promotionRank: row.promotion_rank || 0,
    promotionExpiresAt: row.promotion_expires_at || undefined,
    esDestacado: Boolean(row.promotion_tier && row.promotion_tier !== 'gratis'),
    publishTier: row.publish_tier || 'paid',
    expiresAt: row.expires_at || undefined,
    features: row.features || undefined,
    privateData: row.private_data || undefined,
    precio: row.precio ?? undefined,
    moneda: row.moneda || undefined,
    tipoPrecio: row.tipo_precio || undefined,
    // Add user ID mapping
    usuario_id: row.user_id || row.usuario_id || undefined,
    user_id: row.user_id || row.usuario_id || undefined
  };
}

// Función para convertir de Adiso a la base de datos
export function adisoToDb(adiso: Adiso): any {
  // Convertir array de imágenes a JSON
  const imagenesUrlsJson = adiso.imagenesUrls && adiso.imagenesUrls.length > 0
    ? JSON.stringify(adiso.imagenesUrls)
    : null;

  // Manejar ubicación: si es UbicacionDetallada, extraer campos; sino usar string
  let ubicacionString: string;
  let ubicacionDetallada: any = {};

  if (typeof adiso.ubicacion === 'object' && adiso.ubicacion !== null && 'departamento' in adiso.ubicacion) {
    // Es UbicacionDetallada
    const ubi = adiso.ubicacion as any;
    ubicacionString = `${ubi.distrito || ''}, ${ubi.provincia || ''}, ${ubi.departamento || ''}`.replace(/^,\s*|,\s*$/g, '');
    ubicacionDetallada = {
      pais: ubi.pais || 'Perú',
      departamento: ubi.departamento,
      provincia: ubi.provincia,
      distrito: ubi.distrito,
      direccion: ubi.direccion || null,
      latitud: ubi.latitud || null,
      longitud: ubi.longitud || null
    };
  } else {
    // Es string (compatibilidad hacia atrás)
    ubicacionString = adiso.ubicacion as string || '';
  }

  // Serializar contactos múltiples a JSONB
  const contactosMultiplesJson = adiso.contactosMultiples && adiso.contactosMultiples.length > 0
    ? JSON.stringify(adiso.contactosMultiples)
    : null;

  const dbData: any = {
    id: adiso.id,
    categoria: adiso.categoria,
    titulo: adiso.titulo,
    descripcion: adiso.descripcion || '',
    contacto: adiso.contacto,
    ubicacion: ubicacionString, // Mantener para compatibilidad
    fecha_publicacion: adiso.fechaPublicacion,
    hora_publicacion: adiso.horaPublicacion,
    imagenes_urls: imagenesUrlsJson,
    // Mantener imagen_url para compatibilidad
    imagen_url: adiso.imagenUrl || adiso.imagenesUrls?.[0] || null,
    // Nuevos campos
    fecha_expiracion: adiso.fechaExpiracion || null,
    esta_activo: adiso.estaActivo !== undefined ? adiso.estaActivo : true,
    es_historico: adiso.esHistorico !== undefined ? adiso.esHistorico : false,
    fuente_original: adiso.fuenteOriginal || null,
    edicion_numero: adiso.edicionNumero || null,
    fecha_publicacion_original: adiso.fechaPublicacionOriginal || null,
    contactos_multiples: contactosMultiplesJson,
    publish_tier: adiso.publishTier || (adiso.esGratuito ? 'free' : 'paid'),
    expires_at: adiso.expiresAt || adiso.fechaExpiracion || null,
    features: adiso.features || {},
    private_data: adiso.privateData || {},
    precio: adiso.precio ?? null,
    moneda: adiso.moneda || null,
    tipo_precio: adiso.tipoPrecio || null,
    // Map user_id to DB column
    user_id: adiso.user_id || adiso.usuario_id || (typeof window !== 'undefined' ? (window as any).__SUPABASE_USER_ID : null)
  };

  // Agregar campos de ubicación detallada si existen
  if (ubicacionDetallada.departamento) {
    dbData.pais = ubicacionDetallada.pais;
    dbData.departamento = ubicacionDetallada.departamento;
    dbData.provincia = ubicacionDetallada.provincia;
    dbData.distrito = ubicacionDetallada.distrito;
    if (ubicacionDetallada.direccion) {
      dbData.direccion = ubicacionDetallada.direccion;
    }
    if (ubicacionDetallada.latitud !== null && ubicacionDetallada.latitud !== undefined) {
      dbData.latitud = ubicacionDetallada.latitud;
    }
    if (ubicacionDetallada.longitud !== null && ubicacionDetallada.longitud !== undefined) {
      dbData.longitud = ubicacionDetallada.longitud;
    }
  }

  // Solo incluir tamaño si existe (para evitar errores si la columna no existe en la BD)
  if (adiso.tamaño !== undefined) {
    dbData.tamaño = adiso.tamaño;
  }

  return dbData;
}

export async function getAdisosFromSupabase(options?: {
  limit?: number;
  offset?: number;
  soloActivos?: boolean;
  categoria?: string;
  busqueda?: string;
}): Promise<Adiso[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    await clearExpiredPromotions();

    let query = supabase
      .from('adisos')
      .select('*');

    // Filtrar por activos si se solicita
    if (options?.soloActivos === true) {
      query = query.eq('esta_activo', true);
      // También filtrar por fecha de expiración si existe
      query = query.or('fecha_expiracion.is.null,fecha_expiracion.gt.' + new Date().toISOString());
    }

    // Filtrar por categoría
    if (options?.categoria && options.categoria !== 'todos') {
      query = query.eq('categoria', options.categoria);
    }

    // Filtrar por búsqueda (título, descripción, ubicación texto)
    if (options?.busqueda) {
      const q = options.busqueda;
      query = query.or(`titulo.ilike.%${q}%,descripcion.ilike.%${q}%,ubicacion.ilike.%${q}%`);
    }

    // Ordenar por promoción (premium/destacados primero) y luego por fecha
    query = query.order('promotion_rank', { ascending: false })
      .order('fecha_publicacion', { ascending: false })
      .order('hora_publicacion', { ascending: false });

    // Aplicar paginación si se proporciona (optimizado)
    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    } else {
      // Por defecto, limitar a 50 para mejor rendimiento
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener adisos:', error);
      throw error;
    }

    return data ? data.map(dbToAdiso) : [];
  } catch (error: any) {
    // Si es un error de RLS, dar mensaje más claro
    if (error?.code === 'PGRST301' || error?.message?.includes('permission denied')) {
      throw new Error('Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.');
    }
    throw error;
  }
}

/** Paginación con conteo total (mismos filtros que getAdisosFromSupabase) para APIs públicas. */
export async function getAdisosPageFromSupabase(options: {
  limit: number;
  offset: number;
  soloActivos?: boolean;
  categoria?: string;
  busqueda?: string;
}): Promise<{ items: Adiso[]; total: number }> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    await clearExpiredPromotions();

    let query = supabase
      .from('adisos')
      .select('*', { count: 'exact' });

    if (options.soloActivos === true) {
      query = query.eq('esta_activo', true);
      query = query.or('fecha_expiracion.is.null,fecha_expiracion.gt.' + new Date().toISOString());
    }

    if (options.categoria && options.categoria !== 'todos') {
      query = query.eq('categoria', options.categoria);
    }

    if (options.busqueda) {
      const q = options.busqueda;
      query = query.or(`titulo.ilike.%${q}%,descripcion.ilike.%${q}%,ubicacion.ilike.%${q}%`);
    }

    query = query
      .order('promotion_rank', { ascending: false })
      .order('fecha_publicacion', { ascending: false })
      .order('hora_publicacion', { ascending: false });

    const from = Math.max(0, options.offset);
    const to = from + Math.max(1, options.limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error al obtener página de adisos:', error);
      throw error;
    }

    return {
      items: data ? data.map(dbToAdiso) : [],
      total: count ?? 0,
    };
  } catch (error: any) {
    if (error?.code === 'PGRST301' || error?.message?.includes('permission denied')) {
      throw new Error('Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.');
    }
    throw error;
  }
}

export async function getAdisoByIdFromSupabase(id: string): Promise<Adiso | null> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('adisos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el registro
        return null;
      }
      console.error('Error al obtener adiso:', error);
      throw error;
    }

    return data ? dbToAdiso(data) : null;
  } catch (error: any) {
    if (error?.code === 'PGRST301' || error?.message?.includes('permission denied')) {
      throw new Error('Las políticas de seguridad no están configuradas.');
    }
    throw error;
  }
}

export async function createAdisoInSupabase(adiso: Adiso): Promise<Adiso> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    // Verificar si el adiso ya existe
    const { data: existing } = await supabase
      .from('adisos')
      .select('*')
      .eq('id', adiso.id)
      .single();

    // Si existe, actualizarlo en lugar de crear uno nuevo
    if (existing) {
      return await updateAdisoInSupabase(adiso);
    }

    const { data, error } = await supabase
      .from('adisos')
      .insert(adisoToDb(adiso))
      .select()
      .single();

    if (error) {
      console.error('Error al crear adiso:', error);

      // Errores comunes con mensajes más claros
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('No tienes permiso para crear adisos. Verifica las políticas de seguridad en Supabase.');
      }

      if (error.code === '23505') {
        // Si es duplicado, intentar actualizar
        return await updateAdisoInSupabase(adiso);
      }

      throw error;
    }

    if (!data) {
      throw new Error('No se recibió respuesta al crear el adiso');
    }

    return dbToAdiso(data);
  } catch (error: any) {
    throw error;
  }
}

export async function updateAdisoInSupabase(adiso: Adiso): Promise<Adiso> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('adisos')
      .update(adisoToDb(adiso))
      .eq('id', adiso.id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar adiso:', error);

      // Errores comunes con mensajes más claros
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('No tienes permiso para actualizar adisos. Verifica las políticas de seguridad en Supabase.');
      }

      if (error.code === 'PGRST116') {
        throw new Error('Adiso no encontrado.');
      }

      throw error;
    }

    if (!data) {
      throw new Error('No se recibió respuesta al actualizar el adiso');
    }

    return dbToAdiso(data);
  } catch (error: any) {
    throw error;
  }
}

/**
 * Resetea promociones (destacada/premium) que ya expiraron, para que el
 * ordenamiento del feed sea correcto sin depender de un cron externo.
 * Es de "mejor esfuerzo": si falla no debe bloquear la carga del feed.
 */
async function clearExpiredPromotions(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.rpc('fn_clear_expired_promotions');
  } catch {
    // Ignorar: no es crítico para mostrar el feed
  }
}

/**
 * @deprecated Usar POST /api/adisos/promote (órdenes + pago). Solo para scripts internos con service role.
 * Promociona un adiso propio a un tier (destacada/premium) por N días.
 */
export async function promoteAdisoInSupabase(
  adisoId: string,
  userId: string,
  tier: AdisoPromotionTier,
  days: number
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  const { error } = await supabase.rpc('fn_promote_adiso', {
    p_adiso_id: adisoId,
    p_user_id: userId,
    p_tier: tier,
    p_days: days,
  });

  if (error) {
    console.error('Error al promocionar adiso:', error);
    throw error;
  }
}

export async function deleteAdisoInSupabase(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { error } = await supabase
      .from('adisos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar adiso:', error);

      // Errores comunes con mensajes más claros
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('No tienes permiso para eliminar adisos. Verifica las políticas de seguridad en Supabase.');
      }

      if (error.code === 'PGRST116') {
        throw new Error('Adiso no encontrado.');
      }

      throw error;
    }
  } catch (error: any) {
    throw error;
  }
}

// Funciones para adisos gratuitos

// Función para convertir de la base de datos a AdisoGratuito
function dbToAdisoGratuito(row: any): AdisoGratuito {
  return {
    id: row.id,
    categoria: row.categoria,
    titulo: row.titulo,
    contacto: row.contacto,
    fechaCreacion: row.fecha_creacion,
    fechaExpiracion: row.fecha_expiracion
  };
}

// Función para convertir de AdisoGratuito a la base de datos
function adisoGratuitoToDb(adiso: AdisoGratuito): any {
  return {
    id: adiso.id,
    categoria: adiso.categoria,
    titulo: adiso.titulo,
    contacto: adiso.contacto,
    fecha_creacion: adiso.fechaCreacion,
    fecha_expiracion: adiso.fechaExpiracion
  };
}

export async function getAdisosGratuitosFromSupabase(): Promise<AdisoGratuito[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    // Solo obtener adisos que no han expirado
    const ahora = new Date().toISOString();
    const { data, error } = await supabase
      .from('adisos_gratuitos')
      .select('*')
      .gt('fecha_expiracion', ahora)
      .order('fecha_creacion', { ascending: false })
      .limit(100);

    if (error) {
      // Si la tabla no existe, retornar array vacío en lugar de lanzar error
      if (error.code === 'PGRST204' || error.code === '42P01' ||
        error.message?.includes('relation') && error.message?.includes('does not exist') ||
        error.message?.includes('tabla') || error.message?.includes('table')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Tabla adisos_gratuitos no existe aún, retornando array vacío');
        }
        return [];
      }

      // Error 406 (Not Acceptable) - posible problema de RLS
      if (error.code === 'PGRST301' || error.message?.includes('permission denied') ||
        error.message?.includes('406') || (error as any).status === 406) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error 406 al obtener adisos gratuitos (posible problema de RLS):', error);
        }
        // Retornar array vacío en lugar de lanzar error
        return [];
      }

      console.error('Error al obtener adisos gratuitos:', error);
      throw error;
    }

    return data ? data.map(dbToAdisoGratuito) : [];
  } catch (error: any) {
    // Si es un error de conexión o timeout, lanzar error específico
    if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed') ||
      error?.message?.includes('network') || error?.code === 'ECONNREFUSED') {
      throw new Error('Error de conexión con Supabase. Verifica tu conexión y las credenciales.');
    }

    // Para otros errores, retornar array vacío en lugar de lanzar
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error al obtener adisos gratuitos, retornando array vacío:', error);
    }
    return [];
  }
}

export async function createAdisoGratuitoInSupabase(adiso: AdisoGratuito): Promise<AdisoGratuito> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('adisos_gratuitos')
      .insert(adisoGratuitoToDb(adiso))
      .select()
      .single();

    if (error) {
      console.error('Error al crear adiso gratuito:', error);

      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('No tienes permiso para crear adisos gratuitos. Verifica las políticas de seguridad en Supabase.');
      }

      throw error;
    }

    if (!data) {
      throw new Error('No se recibió respuesta al crear el adiso gratuito');
    }

    return dbToAdisoGratuito(data);
  } catch (error: any) {
    throw error;
  }
}

// ============================================
// FUNCIONES PARA SISTEMA DE ANUNCIOS HISTÓRICOS
// ============================================

export async function registrarInteresAnuncioCaducado(
  adisoId: string,
  usuarioId: string | undefined,
  contactoUsuario: string,
  mensaje?: string
): Promise<InteresAnuncioCaducado> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('intereses_anuncios_caducados')
      .insert({
        adiso_id: adisoId,
        usuario_id: usuarioId || null,
        contacto_usuario: contactoUsuario,
        mensaje: mensaje || null,
        notificado_anunciante: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error al registrar interés:', error);
      throw error;
    }

    return {
      id: data.id,
      adisoId: data.adiso_id,
      usuarioId: data.usuario_id || undefined,
      contactoUsuario: data.contacto_usuario,
      mensaje: data.mensaje || undefined,
      fechaInteres: data.fecha_interes,
      notificadoAnunciante: data.notificado_anunciante,
      fechaNotificacion: data.fecha_notificacion || undefined,
      createdAt: data.created_at
    };
  } catch (error: any) {
    throw error;
  }
}

export async function getInteresesPorAnuncio(adisoId: string): Promise<InteresAnuncioCaducado[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    const { data, error } = await supabase
      .from('intereses_anuncios_caducados')
      .select('*')
      .eq('adiso_id', adisoId)
      .eq('notificado_anunciante', false)
      .order('fecha_interes', { ascending: false });

    if (error) {
      console.error('Error al obtener intereses:', error);
      throw error;
    }

    return data ? data.map((row: any) => ({
      id: row.id,
      adisoId: row.adiso_id,
      usuarioId: row.usuario_id || undefined,
      contactoUsuario: row.contacto_usuario,
      mensaje: row.mensaje || undefined,
      fechaInteres: row.fecha_interes,
      notificadoAnunciante: row.notificado_anunciante,
      fechaNotificacion: row.fecha_notificacion || undefined,
      createdAt: row.created_at
    })) : [];
  } catch (error: any) {
    throw error;
  }
}
