import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MOTO_DOC_TYPES, type MotoDocType } from '@/lib/envios';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: rider } = await supabaseAdmin
    .from('moto_riders')
    .select('id, estado')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!rider) {
    return NextResponse.json(
      { error: 'Crea tu perfil de conductor primero' },
      { status: 400 }
    );
  }

  if (rider.estado === 'aprobado') {
    return NextResponse.json(
      { error: 'Perfil ya aprobado; contacta soporte para actualizar docs' },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const tipo = String(formData.get('tipo') || '') as MotoDocType;
  const file = formData.get('file') as File | null;

  if (!MOTO_DOC_TYPES.includes(tipo)) {
    return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
  }

  const isPdf = file.type === 'application/pdf';
  const arrayBuffer = await file.arrayBuffer();
  let uploadBody: Buffer | Uint8Array = Buffer.from(arrayBuffer);
  let contentType = file.type || 'application/octet-stream';
  let ext = isPdf ? 'pdf' : 'jpg';

  if (!isPdf) {
    try {
      uploadBody = await sharp(Buffer.from(arrayBuffer))
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      contentType = 'image/jpeg';
      ext = 'jpg';
    } catch {
      return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 });
    }
  }

  const path = `${rider.id}/${tipo}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('moto-kyc')
    .upload(path, uploadBody, { contentType, upsert: true });

  if (uploadError) {
    console.error('[envios/kyc upload]', uploadError);
    return NextResponse.json(
      { error: uploadError.message || 'Error al subir' },
      { status: 500 }
    );
  }

  // Signed URL larga para admin review; guardamos path estable
  const { data: signed } = await supabaseAdmin.storage
    .from('moto-kyc')
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  const url = signed?.signedUrl || path;

  const { data: doc, error } = await supabaseAdmin
    .from('moto_rider_docs')
    .upsert(
      {
        rider_id: rider.id,
        tipo,
        url: path, // store storage path; APIs sign on read for admin
      },
      { onConflict: 'rider_id,tipo' }
    )
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also update foto_moto / foto_perfil convenience fields
  if (tipo === 'foto_moto') {
    await supabaseAdmin
      .from('moto_riders')
      .update({ foto_moto_url: url })
      .eq('id', rider.id);
  }
  if (tipo === 'selfie') {
    await supabaseAdmin
      .from('moto_riders')
      .update({ foto_perfil_url: url })
      .eq('id', rider.id);
  }

  return NextResponse.json({
    doc: { ...doc, preview_url: url },
  });
}
