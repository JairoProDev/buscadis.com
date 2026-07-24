import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import {
  IDENTITY_DOC_TYPES,
  type IdentityDocType,
} from '@/lib/auth/identity-kyc';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select(
      'identity_kyc_status, identity_kyc_submitted_at, identity_kyc_rejection_reason, name_match_score, es_verificado, dni, nombre, apellido'
    )
    .eq('id', user.id)
    .maybeSingle();

  const { data: docs } = await supabaseAdmin
    .from('identity_docs')
    .select('tipo, storage_path, created_at')
    .eq('user_id', user.id);

  return NextResponse.json({
    ok: true,
    status: profile?.identity_kyc_status || 'none',
    submitted_at: profile?.identity_kyc_submitted_at,
    rejection_reason: profile?.identity_kyc_rejection_reason,
    name_match_score: profile?.name_match_score,
    es_verificado: profile?.es_verificado,
    docs: (docs || []).map((d) => ({ tipo: d.tipo, uploaded: true, created_at: d.created_at })),
    missing: IDENTITY_DOC_TYPES.filter((t) => !(docs || []).some((d) => d.tipo === t)),
  });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`kyc-upload:${user.id}:${ip}`, { windowMs: 60_000, maxRequests: 20 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas subidas. Espera un minuto.' }, { status: 429 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('identity_kyc_status, dni_verified_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.identity_kyc_status === 'approved') {
    return NextResponse.json(
      { error: 'Ya estás verificado. Contacta soporte para cambiar documentos.' },
      { status: 400 }
    );
  }

  if (!profile?.dni_verified_at) {
    return NextResponse.json(
      { error: 'Primero valida tu DNI en el padrón' },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const tipo = String(formData.get('tipo') || '') as IdentityDocType;
  const file = formData.get('file') as File | null;

  if (!IDENTITY_DOC_TYPES.includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Máximo 5 MB' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  let uploadBody: Buffer;
  try {
    uploadBody = await sharp(Buffer.from(arrayBuffer))
      .rotate()
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 });
  }

  const path = `${user.id}/${tipo}-${Date.now()}.jpg`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('identity-kyc')
    .upload(path, uploadBody, { contentType: 'image/jpeg', upsert: true });

  if (uploadError) {
    console.error('identity-kyc upload', uploadError);
    return NextResponse.json({ error: uploadError.message || 'Error al subir' }, { status: 500 });
  }

  const { error: upsertError } = await supabaseAdmin.from('identity_docs').upsert(
    {
      user_id: user.id,
      tipo,
      storage_path: path,
    },
    { onConflict: 'user_id,tipo' }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Reset rejection if re-uploading
  if (profile?.identity_kyc_status === 'rejected') {
    await supabaseAdmin
      .from('profiles')
      .update({
        identity_kyc_status: 'none',
        identity_kyc_rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  }

  return NextResponse.json({ ok: true, tipo, path });
}
