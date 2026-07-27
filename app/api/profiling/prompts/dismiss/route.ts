import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { isValidPromptId, markPromptDismissed } from '@/lib/profiling/prompt-server';

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`prompt-dismiss:${user.id}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 });
  }

  let body: { prompt_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.prompt_id || !isValidPromptId(body.prompt_id)) {
    return NextResponse.json({ error: 'prompt_id inválido' }, { status: 400 });
  }

  try {
    const result = await markPromptDismissed(user.id, body.prompt_id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[profiling/dismiss]', e);
    return NextResponse.json({ error: 'No se pudo omitir' }, { status: 500 });
  }
}
