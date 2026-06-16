import { NextRequest, NextResponse } from 'next/server';
import {
  getAdisosFromSupabase,
  createAdisoInSupabase
} from '@/lib/supabase';
import { Adiso } from '@/types';
import { generarIdUnico } from '@/lib/utils';
import { createAdisoSchema, sanitizeText } from '@/lib/validations';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { validarImagenesSegunPaquete } from '@/lib/adiso-paquete-server';
import { UBICACION_DEFAULT_CUSCO } from '@/lib/publish-helpers';

export const dynamic = 'force-dynamic';

// Esta función maneja GET para obtener todos los adisos
export async function GET(request: NextRequest) {
  // Rate limiting para GET (más permisivo)
  const ip = getClientIP(request);
  const limitResult = rateLimit(`get-adisos-${ip}`, {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 120, // 120 requests por minuto
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Demasiadas solicitudes. Por favor intenta más tarde.',
        retryAfter: Math.ceil((limitResult.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '120',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': limitResult.resetTime.toString(),
        }
      }
    );
  }
  try {
    // Soporte para paginación eficiente (paginación en BD, no en memoria)
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Validar límites
    if (page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Parámetros de paginación inválidos. page >= 1, limit entre 1 y 1000' },
        { status: 400 }
      );
    }

    // Calcular offset para paginación eficiente
    const offset = (page - 1) * limit;

    // Obtener total de adisos para calcular hasMore (solo si es necesario)
    // Por ahora, asumimos que si obtenemos 'limit' resultados, hay más
    const adisos = await getAdisosFromSupabase({
      limit: limit + 1, // Obtener uno más para saber si hay más páginas
      offset: offset,
      soloActivos: false
    });

    // Determinar si hay más páginas
    const hasMore = adisos.length > limit;
    const paginatedAdisos = hasMore ? adisos.slice(0, limit) : adisos;

    return NextResponse.json({
      data: paginatedAdisos,
      pagination: {
        page,
        limit,
        hasMore,
        nextPage: hasMore ? page + 1 : null
      }
    });
  } catch (error: any) {
    console.error('Error al obtener adisos:', error);

    // Mensajes más descriptivos
    let errorMessage = 'Error al obtener adisos';
    let statusCode = 500;

    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.';
      statusCode = 403;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed')) {
      errorMessage = 'Error de conexión con Supabase. Verifica tu conexión y las credenciales.';
      statusCode = 503;
    }

    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: statusCode }
    );
  }
}

// Esta función maneja POST para crear un nuevo adiso
export async function POST(request: NextRequest) {
  // Rate limiting más estricto para POST
  const ip = getClientIP(request);
  const limitResult = rateLimit(`post-adisos-${ip}`, {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10, // Solo 10 creaciones por minuto
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Demasiadas solicitudes de creación. Por favor espera un momento antes de intentar nuevamente.',
        retryAfter: Math.ceil((limitResult.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': limitResult.resetTime.toString(),
        }
      }
    );
  }

  try {
    const body = await request.json();

    // Validar y sanitizar entrada
    const validationResult = createAdisoSchema.safeParse(body);

    if (!validationResult.success) {
      const errorDetails = validationResult.error.issues.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code
      }));

      console.error('Error de validación:', {
        body: JSON.stringify(body, null, 2),
        errors: errorDetails
      });

      return NextResponse.json(
        {
          error: 'Datos de entrada inválidos',
          details: errorDetails,
          // Incluir el primer error como mensaje principal para debugging
          message: errorDetails[0]?.message || 'Datos de entrada inválidos'
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const ubicacionBody = body.ubicacion ?? validatedData.ubicacion;
    const ubicacionOriginal =
      ubicacionBody &&
      (typeof ubicacionBody === 'string' ? ubicacionBody.trim() : ubicacionBody.distrito?.trim())
        ? ubicacionBody
        : UBICACION_DEFAULT_CUSCO;

    // Preservar ubicación original del body (puede ser objeto o string)
    const tieneUbicacionDetallada = typeof ubicacionOriginal === 'object' &&
      ubicacionOriginal !== null &&
      'departamento' in ubicacionOriginal;

    // Sanitizar campos de texto
    // Nota: validatedData.contacto ya está normalizado por el transform de Zod (sin espacios)
    const sanitizedData = {
      ...validatedData,
      titulo: sanitizeText(validatedData.titulo),
      descripcion: validatedData.descripcion ? sanitizeText(validatedData.descripcion) : '',
      // Preservar objeto de ubicación si existe, sino sanitizar el string
      ubicacion: tieneUbicacionDetallada
        ? ubicacionOriginal
        : (typeof ubicacionOriginal === 'string' && ubicacionOriginal.trim()
          ? sanitizeText(ubicacionOriginal)
          : UBICACION_DEFAULT_CUSCO),
      // El contacto ya está normalizado por el transform de Zod, solo sanitizar si es necesario
      contacto: validatedData.contacto, // Ya está normalizado (sin espacios)
    };

    // Verificar si el body original tiene id y fechas
    const bodyHasId = 'id' in body && typeof body.id === 'string';
    const bodyHasDates = 'fechaPublicacion' in body && 'horaPublicacion' in body;

    // Si el body ya tiene un adiso completo con id, usarlo directamente
    // Si no, crear uno nuevo
    let nuevoAdiso: Adiso;

    if (bodyHasId && bodyHasDates) {
      // El adiso ya está completo, usarlo tal cual (con sanitización)
      nuevoAdiso = {
        ...sanitizedData,
        id: body.id as string,
        fechaPublicacion: body.fechaPublicacion as string,
        horaPublicacion: body.horaPublicacion as string,
        // Preservar ubicación detallada si existe
        ubicacion: sanitizedData.ubicacion,
      } as Adiso;
    } else {
      // Crear un nuevo adiso
      const ahora = new Date();
      const fecha = ahora.toISOString().split('T')[0];
      const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);

      // Usar el ID del body si existe, sino generar uno nuevo
      const idUnico = (bodyHasId ? body.id : generarIdUnico()) as string;

      nuevoAdiso = {
        id: idUnico,
        categoria: sanitizedData.categoria,
        titulo: sanitizedData.titulo,
        descripcion: sanitizedData.descripcion || '',
        contacto: sanitizedData.contacto,
        // Preservar ubicación detallada si existe
        ubicacion: sanitizedData.ubicacion,
        tamaño: sanitizedData.tamaño || 'miniatura',
        fechaPublicacion: sanitizedData.fechaPublicacion || fecha,
        horaPublicacion: sanitizedData.horaPublicacion || hora,
        imagenesUrls: sanitizedData.imagenesUrls || undefined,
        // Compatibilidad hacia atrás
        imagenUrl: sanitizedData.imagenUrl || sanitizedData.imagenesUrls?.[0] || undefined,
        // Los gratuitos van por /api/adisos-gratuitos; aquí solo anuncios de pago
        esGratuito: false,
        // Ensure user ID is passed to DB function
        user_id: sanitizedData.user_id,
        usuario_id: sanitizedData.usuario_id
      };
    }

    // Misma regla de negocio para cuerpos “completos” enviados por el cliente
    nuevoAdiso.esGratuito = false;

    const imgCheck = validarImagenesSegunPaquete(
      nuevoAdiso.tamaño,
      nuevoAdiso.imagenesUrls,
      nuevoAdiso.imagenUrl
    );
    if (!imgCheck.ok) {
      return NextResponse.json({ error: imgCheck.message }, { status: 400 });
    }

    const adisoCreado = await createAdisoInSupabase(nuevoAdiso);

    const { onAdisoSearchIndexUpdate } = await import('@/lib/search/post-create');
    onAdisoSearchIndexUpdate(adisoCreado);

    if (nuevoAdiso.user_id || nuevoAdiso.usuario_id) {
      const ownerId = (nuevoAdiso.user_id || nuevoAdiso.usuario_id) as string;
      const { createStoryFromAdiso } = await import('@/lib/stories/adiso-sync');
      void createStoryFromAdiso(ownerId, adisoCreado, {
        promotionTier: adisoCreado.promotionTier,
      });
    }

    return NextResponse.json(adisoCreado, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear adiso:', error);

    // Mensajes más descriptivos
    let errorMessage = 'Error al crear adiso';
    let statusCode = 500;

    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'Las políticas de seguridad no están configuradas. Ejecuta el SQL de seguridad en Supabase.';
      statusCode = 403;
    } else if (error?.message?.includes('timeout') || error?.message?.includes('fetch failed')) {
      errorMessage = 'Error de conexión con Supabase. Verifica tu conexión y las credenciales.';
      statusCode = 503;
    } else if (error?.message?.includes('duplicado')) {
      errorMessage = 'Este adiso ya existe.';
      statusCode = 409;
    } else if (error?.code === 'PGRST204' && error?.message?.includes('tamaño')) {
      errorMessage = 'La columna "tamaño" no existe en la tabla adisos. Ejecuta el script SQL "supabase-adisos-tamaño.sql" en Supabase.';
      statusCode = 500;
    } else if (error?.code === 'PGRST204') {
      errorMessage = `Columna no encontrada en la base de datos: ${error?.message || 'Error desconocido'}. Verifica el esquema de la base de datos.`;
      statusCode = 500;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error?.message,
        details: error?.details || error?.hint || 'No details',
        code: error?.code
      },
      { status: statusCode }
    );
  }
}
