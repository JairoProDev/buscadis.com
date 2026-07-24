import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { isDniResult, isRucResult, lookupDni, lookupRuc } from '@/lib/peru-id/decolecta';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { UserIntencion } from '@/lib/auth/profile-complete';
import { needsBusinessRuc } from '@/lib/auth/profile-complete';

const INTENCIONES: UserIntencion[] = ['explorador', 'anunciante', 'negocio'];

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`onboarding:${user.id}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 20,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 });
  }

  let body: {
    intencion?: string;
    dni?: string;
    ruc?: string;
    confirmNombre?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const intencion = body.intencion as UserIntencion | undefined;
  if (!intencion || !INTENCIONES.includes(intencion)) {
    return NextResponse.json({ error: 'Elige si buscas oportunidades o publicarás' }, { status: 400 });
  }

  const dniResult = await lookupDni(String(body.dni || ''));
  if (!isDniResult(dniResult)) {
    return NextResponse.json({ error: dniResult.error }, { status: dniResult.status });
  }

  const { data: dniOwner } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('dni', dniResult.dni)
    .neq('id', user.id)
    .maybeSingle();

  if (dniOwner) {
    return NextResponse.json(
      { error: 'Este DNI ya está vinculado a otra cuenta' },
      { status: 409 }
    );
  }

  let rucVerifiedAt: string | null = null;
  let rucValue: string | null = null;
  let razonSocial: string | null = null;

  if (needsBusinessRuc(intencion)) {
    const rucRaw = String(body.ruc || '').replace(/\D/g, '');
    if (!rucRaw) {
      return NextResponse.json(
        { error: 'Si publicas o tienes negocio, indica tu RUC (10 o 20)' },
        { status: 400 }
      );
    }
    const rucResult = await lookupRuc(rucRaw);
    if (!isRucResult(rucResult)) {
      return NextResponse.json({ error: rucResult.error }, { status: rucResult.status });
    }
    rucValue = rucResult.ruc;
    razonSocial = rucResult.razonSocial;
    rucVerifiedAt = new Date().toISOString();
  }

  const now = new Date().toISOString();
  const nombre = dniResult.nombres;
  const apellido = [dniResult.apellidoPaterno, dniResult.apellidoMaterno].filter(Boolean).join(' ');

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email,
        nombre,
        apellido,
        dni: dniResult.dni,
        dni_verified_at: now,
        ruc: rucValue,
        ruc_verified_at: rucVerifiedAt,
        intencion,
        rol: intencion === 'explorador' ? 'usuario' : 'anunciante',
        updated_at: now,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('onboarding upsert', error);
    return NextResponse.json({ error: 'No se pudo guardar tu identidad' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    profile,
    dni: dniResult,
    ...(razonSocial ? { razonSocial } : {}),
  });
}
