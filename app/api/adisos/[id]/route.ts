import { NextRequest, NextResponse } from 'next/server';
import { deleteAdisoInSupabase, getAdisoByIdFromSupabase, updateAdisoInSupabase } from '@/lib/supabase';
import { Adiso } from '@/types';
import { createAdisoSchema, sanitizeText } from '@/lib/validations';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

// GET: Obtener un adiso por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request);
  const limitResult = rateLimit(`get-adiso-${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 120,
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
      { status: 429 }
    );
  }

  try {
    const { id } = await params;
    const adiso = await getAdisoByIdFromSupabase(id);

    if (!adiso) {
      return NextResponse.json(
        { error: 'Adiso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(adiso);
  } catch (error: any) {
    console.error('Error al obtener adiso:', error);
    return NextResponse.json(
      { error: 'Error al obtener adiso', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un adiso
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request);
  const limitResult = rateLimit(`put-adiso-${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 20,
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
      { status: 429 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Validar que el ID coincida
    if (body.id && body.id !== id) {
      return NextResponse.json(
        { error: 'El ID del body no coincide con el ID de la URL' },
        { status: 400 }
      );
    }

    // Validar y sanitizar entrada
    const validationResult = createAdisoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos de entrada inválidos',
          details: validationResult.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verificar que el adiso existe
    const adisoExistente = await getAdisoByIdFromSupabase(id);
    if (!adisoExistente) {
      return NextResponse.json(
        { error: 'Adiso no encontrado' },
        { status: 404 }
      );
    }

    // Preservar ubicación original del body (puede ser objeto o string)
    const ubicacionOriginal = body.ubicacion;
    const tieneUbicacionDetallada = typeof ubicacionOriginal === 'object' && 
                                     ubicacionOriginal !== null && 
                                     'departamento' in ubicacionOriginal;

    // Sanitizar campos de texto y convertir null a undefined para compatibilidad con el tipo Adiso
    // Convertir explícitamente null a undefined con verificación de tipo estricta
    let imagenesUrlsSanitized: string[] | undefined = undefined;
    if (validatedData.imagenesUrls !== null && validatedData.imagenesUrls !== undefined) {
      imagenesUrlsSanitized = validatedData.imagenesUrls;
    }
    
    let imagenUrlSanitized: string | undefined = undefined;
    if (validatedData.imagenUrl !== null && validatedData.imagenUrl !== undefined) {
      imagenUrlSanitized = validatedData.imagenUrl;
    }

    // Actualizar el adiso (mantener fechas originales)
    // Construir explícitamente para evitar problemas de tipos con null
    const adisoActualizado = {
      id,
      categoria: validatedData.categoria,
      titulo: sanitizeText(validatedData.titulo),
      descripcion: validatedData.descripcion 
        ? sanitizeText(validatedData.descripcion) 
        : adisoExistente.descripcion, // Mantener descripción existente si no se proporciona
      contacto: sanitizeText(validatedData.contacto),
      // Preservar objeto de ubicación si existe, sino sanitizar el string
      ubicacion: tieneUbicacionDetallada 
        ? ubicacionOriginal 
        : (typeof validatedData.ubicacion === 'string' ? sanitizeText(validatedData.ubicacion) : adisoExistente.ubicacion),
      fechaPublicacion: adisoExistente.fechaPublicacion,
      horaPublicacion: adisoExistente.horaPublicacion,
      tamaño: validatedData.tamaño ?? adisoExistente.tamaño,
      imagenesUrls: imagenesUrlsSanitized,
      imagenUrl: imagenUrlSanitized,
      esGratuito: adisoExistente.esGratuito,
    } as Adiso;

    const resultado = await updateAdisoInSupabase(adisoActualizado);

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Error al actualizar adiso:', error);
    let errorMessage = 'Error al actualizar adiso';
    let statusCode = 500;

    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'No tienes permiso para actualizar este adiso.';
      statusCode = 403;
    } else if (error?.message?.includes('no encontrado')) {
      errorMessage = 'Adiso no encontrado.';
      statusCode = 404;
    }

    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: statusCode }
    );
  }
}

// DELETE: Eliminar un adiso
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request);
  const limitResult = rateLimit(`delete-adiso-${ip}`, {
    windowMs: 60 * 1000,
    maxRequests: 10,
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor intenta más tarde.' },
      { status: 429 }
    );
  }

  try {
    const { id } = await params;

    // Verificar que el adiso existe
    const adisoExistente = await getAdisoByIdFromSupabase(id);
    if (!adisoExistente) {
      return NextResponse.json(
        { error: 'Adiso no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el adiso
    await deleteAdisoInSupabase(id);

    return NextResponse.json(
      { success: true, message: 'Adiso eliminado correctamente' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al eliminar adiso:', error);
    let errorMessage = 'Error al eliminar adiso';
    let statusCode = 500;

    if (error?.message?.includes('políticas de seguridad') || error?.message?.includes('permission denied')) {
      errorMessage = 'No tienes permiso para eliminar este adiso.';
      statusCode = 403;
    } else if (error?.message?.includes('no encontrado')) {
      errorMessage = 'Adiso no encontrado.';
      statusCode = 404;
    }

    return NextResponse.json(
      { error: errorMessage, details: error?.message },
      { status: statusCode }
    );
  }
}
