import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { mergeAnonymousEvents } from '@/lib/behavior/merge-anonymous';

const bodySchema = z.object({
  anonymousId: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`events-merge:${user.id}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'anonymousId inválido' }, { status: 400 });
  }

  const result = await mergeAnonymousEvents(user.id, parsed.data.anonymousId);
  return NextResponse.json({ ok: true, ...result });
}
