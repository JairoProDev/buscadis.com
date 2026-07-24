import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { isDniResult, isRucResult, lookupDni, lookupRuc } from '@/lib/peru-id/decolecta';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { upsertCapability, type CapabilityKey } from '@/lib/auth/capabilities';

const CAP_KEYS: CapabilityKey[] = ['publish', 'business', 'rider', 'influencer'];
const GENEROS = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'] as const;

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
    dni?: string;
    ruc?: string;
    fecha_nacimiento?: string;
    genero?: string;
    interests?: string[];
    referred_by_code?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
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

  const interests = (body.interests || []).filter((c): c is CapabilityKey =>
    CAP_KEYS.includes(c as CapabilityKey)
  );

  let rucVerifiedAt: string | null = null;
  let rucValue: string | null = null;
  let razonSocial: string | null = null;

  if (interests.includes('business') || body.ruc) {
    const rucRaw = String(body.ruc || '').replace(/\D/g, '');
    if (rucRaw) {
      const rucResult = await lookupRuc(rucRaw);
      if (!isRucResult(rucResult)) {
        return NextResponse.json({ error: rucResult.error }, { status: rucResult.status });
      }
      rucValue = rucResult.ruc;
      razonSocial = rucResult.razonSocial;
      rucVerifiedAt = new Date().toISOString();
    }
  }

  const genero =
    body.genero && GENEROS.includes(body.genero as (typeof GENEROS)[number])
      ? body.genero
      : null;

  let fechaNacimiento: string | null = null;
  if (body.fecha_nacimiento) {
    const d = new Date(body.fecha_nacimiento);
    if (!Number.isNaN(d.getTime())) {
      fechaNacimiento = body.fecha_nacimiento.slice(0, 10);
    }
  }

  const wantsPublish = interests.includes('publish') || interests.includes('business');
  const intencion = interests.includes('business')
    ? 'negocio'
    : interests.includes('publish')
      ? 'anunciante'
      : 'explorador';

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
        can_publish: wantsPublish,
        rol: wantsPublish ? 'anunciante' : 'usuario',
        fecha_nacimiento: fechaNacimiento,
        genero,
        referred_by_code: body.referred_by_code?.trim().toUpperCase() || null,
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

  for (const cap of interests) {
    if (cap === 'publish') {
      await upsertCapability(user.id, 'publish', 'active');
    } else if (cap === 'business') {
      await upsertCapability(user.id, 'publish', 'active');
      await upsertCapability(user.id, 'business', 'inactive', { interested: true });
    } else {
      await upsertCapability(user.id, cap, 'inactive', { interested: true });
    }
  }

  return NextResponse.json({
    ok: true,
    profile,
    dni: dniResult,
    ...(razonSocial ? { razonSocial } : {}),
  });
}
