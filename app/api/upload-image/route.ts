import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateImageFile } from '@/lib/validations';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import sharp from 'sharp';
import { ADISO_IMAGES_BUCKET_FALLBACKS, FEEDBACK_IMAGES_BUCKET } from '@/lib/storage-buckets';

// Configuración de exportación dinámica para evitar errores en build
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  // Rate limiting para upload de imágenes
  const ip = getClientIP(request);
  const limitResult = rateLimit(`upload-image-${ip}`, {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 20, // 20 uploads por minuto
  });

  if (!limitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Demasiadas solicitudes de subida. Por favor espera un momento.',
        retryAfter: Math.ceil((limitResult.resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString(),
        }
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      );
    }

    // Validar imagen
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado' },
        { status: 500 }
      );
    }

    // Validar dimensiones reales de la imagen y optimizar
    let finalBuffer: Buffer;
    let finalContentType: string;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const metadata = await sharp(buffer).metadata();

      if (!metadata.width || !metadata.height) {
        return NextResponse.json(
          { error: 'No se pudieron leer las dimensiones de la imagen' },
          { status: 400 }
        );
      }

      const MAX_DIMENSION = 4096; // Máximo de dimensiones de imagen
      if (metadata.width && metadata.width > MAX_DIMENSION || metadata.height && metadata.height > MAX_DIMENSION) {
        return NextResponse.json(
          { error: `Las dimensiones de la imagen exceden el máximo permitido (${MAX_DIMENSION}px)` },
          { status: 400 }
        );
      }

      // Comprimir y optimizar imagen antes de subir
      finalBuffer = await sharp(buffer)
        .resize(2048, 2048, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      finalContentType = 'image/jpeg';

    } catch (imageError: any) {
      console.error('Error al procesar imagen:', imageError);
      return NextResponse.json(
        { error: 'Error al procesar la imagen. Asegúrate de que sea una imagen válida.' },
        { status: 400 }
      );
    }

    // Generar nombre único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    // Siempre usar .jpg porque optimizamos a JPEG
    const extension = 'jpg';
    // Determinar si es para feedback o adiso basado en el tipo de archivo o parámetro
    const tipo = request.headers.get('x-upload-type') || 'adisos'; // Por defecto adisos
    const fileName = `${tipo}/${timestamp}-${random}.${extension}`;

    const bucketCandidates =
      tipo === 'feedback' ? [FEEDBACK_IMAGES_BUCKET] : ADISO_IMAGES_BUCKET_FALLBACKS;

    let bucketUsado: string | null = null;
    let uploadError: { message?: string } | null = null;

    for (const bucketName of bucketCandidates) {
      const { error } = await supabase!.storage
        .from(bucketName)
        .upload(fileName, finalBuffer, {
          contentType: finalContentType,
          upsert: false,
        });

      if (!error) {
        bucketUsado = bucketName;
        uploadError = null;
        break;
      }

      uploadError = error;
      const bucketMissing =
        error.message?.toLowerCase().includes('bucket') ||
        error.message?.toLowerCase().includes('not found');

      if (!bucketMissing) {
        break;
      }
    }

    if (!bucketUsado || uploadError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al subir imagen a Supabase Storage:', uploadError);
      }

      let errorMessage = 'No se pudo subir la imagen. Intenta de nuevo en unos minutos.';
      const msg = uploadError?.message?.toLowerCase() ?? '';
      if (msg.includes('bucket') || msg.includes('not found')) {
        errorMessage =
          'No encontramos el bucket de imágenes en Supabase. Crea el bucket público "avisos-images" o contacta soporte.';
      } else if (msg.includes('permission') || msg.includes('403')) {
        errorMessage = 'No hay permiso para subir imágenes. Revisa las políticas de Storage en Supabase.';
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const { data: urlData } = supabase!.storage
      .from(bucketUsado)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl
    });
  } catch (error: any) {
    console.error('Error en API de upload-image:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

