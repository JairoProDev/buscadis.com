import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBusinessProfileBySlug } from '@/lib/business';
import { createServerClient } from '@/lib/supabase-server';
import { canUsePerfilVivoIa } from '@/lib/business/subscription';
import { waMeUrl } from '@/lib/business/commerce';

const bodySchema = z.object({
  pregunta: z.string().min(2).max(400),
});

/**
 * P5 — Cerebro del local (Max): responde con FAQ entrenada + datos del perfil.
 * Sin LLM externo aún: matching lexical + handoff WA estructurado.
 * Listo para enchufar tools (pedido/agenda) cuando haya provider.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const profile = await getBusinessProfileBySlug(
    decodeURIComponent((await params).businessId)
  );
  if (!profile) {
    return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 });
  }

  if (!canUsePerfilVivoIa({ subscription_tier: profile.subscription_tier })) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ADIS AI del local es parte de Max (S/300).',
        upgrade: 'max',
      },
      { status: 402 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Pregunta inválida' }, { status: 400 });
  }

  const q = parsed.data.pregunta.trim().toLowerCase();
  const supabase = await createServerClient();
  const { data: faqs } = await supabase
    .from('business_faq_trained')
    .select('pregunta, respuesta')
    .eq('business_profile_id', profile.id)
    .eq('active', true)
    .limit(50);

  let best: { pregunta: string; respuesta: string; score: number } | null = null;
  for (const f of faqs || []) {
    const p = f.pregunta.toLowerCase();
    let score = 0;
    if (p === q) score = 100;
    else if (p.includes(q) || q.includes(p)) score = 80;
    else {
      const tokens = q.split(/\W+/).filter((t) => t.length > 2);
      const hits = tokens.filter((t) => p.includes(t)).length;
      score = hits * 15;
    }
    if (!best || score > best.score) best = { ...f, score };
  }

  const phone = profile.contact_whatsapp || profile.contact_phone;
  if (best && best.score >= 30) {
    return NextResponse.json({
      ok: true,
      answered: true,
      respuesta: best.respuesta,
      matched: best.pregunta,
      tools: ['faq'],
    });
  }

  const wa = phone
    ? waMeUrl(
        phone,
        `Hola, vi ${profile.name} en Buscadis. ${parsed.data.pregunta}`
      )
    : null;

  return NextResponse.json({
    ok: true,
    answered: false,
    respuesta:
      'No tengo esa respuesta en la base del negocio. Te conecto por WhatsApp para que te atiendan.',
    waUrl: wa,
    tools: ['handoff_wa'],
  });
}
