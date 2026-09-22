import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { transcribeAudio } from '@/lib/ai/gemini';

/**
 * Server STT for publish capture (Safari / Android where Web Speech is weak).
 * POST multipart/form-data with field `audio`.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const limited = rateLimit(`publish-stt-${ip}`, { windowMs: 60_000, maxRequests: 12 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const form = await request.formData();
    const audio = form.get('audio');
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: 'Falta archivo audio' }, { status: 400 });
    }
    if (audio.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio demasiado grande (máx 8 MB)' }, { status: 400 });
    }

    const text = await transcribeAudio(audio);
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No se pudo transcribir el audio' }, { status: 422 });
    }

    return NextResponse.json({ text: text.trim() });
  } catch (e) {
    console.error('[publish/stt]', e);
    const message = e instanceof Error ? e.message : 'Error al transcribir';
    const status = message.includes('no configurado') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
