import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { IDENTITY_DOC_TYPES, nameMatchScore } from '@/lib/auth/identity-kyc';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`kyc-submit:${user.id}:${ip}`, { windowMs: 60_000, maxRequests: 5 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Espera un momento' }, { status: 429 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select(
      'dni, dni_verified_at, nombre, apellido, identity_kyc_status, google_profile'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.dni_verified_at || !profile.dni) {
    return NextResponse.json({ error: 'Valida tu DNI primero' }, { status: 400 });
  }

  if (profile.identity_kyc_status === 'approved') {
    return NextResponse.json({ ok: true, status: 'approved', already: true });
  }

  if (profile.identity_kyc_status === 'pending') {
    return NextResponse.json({ ok: true, status: 'pending', already: true });
  }

  const { data: docs } = await supabaseAdmin
    .from('identity_docs')
    .select('tipo')
    .eq('user_id', user.id);

  const tipos = new Set((docs || []).map((d) => d.tipo));
  const missing = IDENTITY_DOC_TYPES.filter((t) => !tipos.has(t));
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: 'Faltan fotos: DNI frente, DNI reverso y selfie con el DNI',
        missing,
      },
      { status: 400 }
    );
  }

  const padronName = `${profile.nombre || ''} ${profile.apellido || ''}`.trim();
  const gp = (profile.google_profile || {}) as Record<string, unknown>;
  const googleName =
    (typeof gp.name === 'string' && gp.name) ||
    [gp.given_name, gp.family_name].filter(Boolean).join(' ') ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    '';

  const score = nameMatchScore(String(googleName), padronName);
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      identity_kyc_status: 'pending',
      identity_kyc_submitted_at: now,
      identity_kyc_rejection_reason: null,
      name_match_score: score,
      updated_at: now,
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Soft flag in verificaciones table if exists
  try {
    await supabaseAdmin.from('verificaciones').insert({
      user_id: user.id,
      tipo: 'identidad',
      estado: 'pendiente',
      datos_verificacion: {
        dni: profile.dni,
        name_match_score: score,
        google_name: googleName,
        padron_name: padronName,
        source: 'photo_kyc',
      },
    });
  } catch {
    /* table may not exist or RLS — ignore */
  }

  return NextResponse.json({
    ok: true,
    status: 'pending',
    name_match_score: score,
    name_match_warning: score < 0.35,
  });
}
