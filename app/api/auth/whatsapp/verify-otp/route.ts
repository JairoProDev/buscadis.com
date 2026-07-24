import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { verifyWhatsappOtp } from '@/lib/auth/whatsapp-otp';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`wa-otp-verify:${user.id}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 });
  }

  let body: { phone?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const result = await verifyWhatsappOtp(user.id, String(body.phone || ''), String(body.code || ''));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      whatsapp: result.phone,
      telefono: result.phone,
      whatsapp_verified_at: now,
      updated_at: now,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('profile whatsapp update', updateError);
    return NextResponse.json({ error: 'No se pudo guardar el WhatsApp' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phone: result.phone });
}
