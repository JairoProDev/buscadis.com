import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { syncGoogleProfileFromUser } from '@/lib/auth/sync-google-profile';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`sync-google:${user.id}:${ip}`, { windowMs: 60_000, maxRequests: 10 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 });
  }

  const result = await syncGoogleProfileFromUser(user);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'No se pudo sincronizar' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
