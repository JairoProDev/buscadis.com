import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { isRucResult, lookupRuc } from '@/lib/peru-id/decolecta';

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`identity-ruc:${user.id}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas consultas. Espera un momento.' }, { status: 429 });
  }

  let body: { ruc?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const result = await lookupRuc(String(body.ruc || ''));
  if (!isRucResult(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, data: result });
}
