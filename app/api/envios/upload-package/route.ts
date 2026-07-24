import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

/** Foto pública opcional del paquete */
export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  let buffer: Buffer;
  try {
    buffer = await sharp(Buffer.from(arrayBuffer))
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 });
  }

  const path = `${user.id}/${Date.now()}.jpg`;
  const { error } = await supabaseAdmin.storage
    .from('moto-packages')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('moto-packages')
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
