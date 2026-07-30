import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { createAndSendWhatsappOtp } from '@/lib/auth/whatsapp-otp';

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`wa-otp-send:${user.id}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 3,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Espera un minuto antes de pedir otro código.' },
      { status: 429 }
    );
  }

  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const result = await createAndSendWhatsappOtp(user.id, String(body.phone || ''));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    channel: result.channel,
    skipVerification: result.skipVerification === true,
    message: result.message || undefined,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
}
