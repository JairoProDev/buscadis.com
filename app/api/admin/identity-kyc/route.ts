import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isPlatformAdminUser } from '@/lib/platform-admin';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) return null;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('rol, is_platform_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!isPlatformAdminUser(user.email, profile)) return null;
  return user;
}

async function signPath(path: string): Promise<string> {
  const { data } = await supabaseAdmin.storage
    .from('identity-kyc')
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl || '';
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get('status') || 'pending';

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, email, nombre, apellido, dni, whatsapp, identity_kyc_status, identity_kyc_submitted_at, name_match_score, google_profile, avatar_url'
    )
    .eq('identity_kyc_status', status)
    .order('identity_kyc_submitted_at', { ascending: true, nullsFirst: false })
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = await Promise.all(
    (profiles || []).map(async (p) => {
      const { data: docs } = await supabaseAdmin
        .from('identity_docs')
        .select('tipo, storage_path')
        .eq('user_id', p.id);
      const signed = await Promise.all(
        (docs || []).map(async (d) => ({
          tipo: d.tipo,
          preview_url: await signPath(d.storage_path),
        }))
      );
      return { ...p, docs: signed };
    })
  );

  return NextResponse.json({ ok: true, rows });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { user_id?: string; action?: 'approve' | 'reject'; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.user_id || !body.action) {
    return NextResponse.json({ error: 'user_id y action requeridos' }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (body.action === 'approve') {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        identity_kyc_status: 'approved',
        identity_kyc_reviewed_at: now,
        identity_kyc_rejection_reason: null,
        es_verificado: true,
        fecha_verificacion: now,
        updated_at: now,
      })
      .eq('id', body.user_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabaseAdmin
      .from('verificaciones')
      .update({ estado: 'aprobado', fecha_revision: now, revisado_por: admin.id })
      .eq('user_id', body.user_id)
      .eq('tipo', 'identidad')
      .eq('estado', 'pendiente');

    return NextResponse.json({ ok: true, status: 'approved' });
  }

  const reason = (body.reason || 'Documentos ilegibles o no coinciden').slice(0, 500);
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      identity_kyc_status: 'rejected',
      identity_kyc_reviewed_at: now,
      identity_kyc_rejection_reason: reason,
      es_verificado: false,
      updated_at: now,
    })
    .eq('id', body.user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin
    .from('verificaciones')
    .update({
      estado: 'rechazado',
      motivo_rechazo: reason,
      fecha_revision: now,
      revisado_por: admin.id,
    })
    .eq('user_id', body.user_id)
    .eq('tipo', 'identidad')
    .eq('estado', 'pendiente');

  return NextResponse.json({ ok: true, status: 'rejected' });
}
