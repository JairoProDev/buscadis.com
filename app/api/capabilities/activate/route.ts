import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import {
  ensureCreatorWithReferral,
  getUserCapabilities,
  reconcileCapabilitiesFromEntities,
  upsertCapability,
  type CapabilityKey,
} from '@/lib/auth/capabilities';
import { supabaseAdmin } from '@/lib/supabase-admin';

const KEYS: CapabilityKey[] = ['publish', 'business', 'rider', 'influencer'];

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const caps = await reconcileCapabilitiesFromEntities(user.id);
  return NextResponse.json({ ok: true, capabilities: caps });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`cap-activate:${user.id}:${ip}`, { windowMs: 60_000, maxRequests: 20 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 });
  }

  let body: { capability?: string; interest?: boolean; handle?: string; bio?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const capability = body.capability as CapabilityKey | undefined;
  if (!capability || !KEYS.includes(capability)) {
    return NextResponse.json({ error: 'Capacidad inválida' }, { status: 400 });
  }

  // Mark interest only
  if (body.interest) {
    await upsertCapability(user.id, capability, 'inactive', { interested: true });
    return NextResponse.json({
      ok: true,
      capabilities: await getUserCapabilities(user.id),
      next: null,
    });
  }

  let next: string | null = null;

  if (capability === 'publish') {
    await upsertCapability(user.id, capability, 'active');
    next = '/publicar';
  } else if (capability === 'business') {
    await upsertCapability(user.id, capability, 'pending', { setup: true });
    next = '/mi-negocio';
  } else if (capability === 'rider') {
    await upsertCapability(user.id, capability, 'pending');
    // Ensure draft rider row exists lightly
    const { data: rider } = await supabaseAdmin
      .from('moto_riders')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!rider) {
      await supabaseAdmin.from('moto_riders').insert({
        user_id: user.id,
        estado: 'borrador',
      });
    }
    next = '/delivery/llevar/registro';
  } else if (capability === 'influencer') {
    const created = await ensureCreatorWithReferral(user.id, {
      handle: body.handle,
      bio: body.bio,
    });
    if (!created.ok) {
      return NextResponse.json({ error: created.error || 'No se pudo crear creator' }, { status: 500 });
    }
    next = '/perfil/creator';
  }

  return NextResponse.json({
    ok: true,
    capabilities: await getUserCapabilities(user.id),
    next,
  });
}
