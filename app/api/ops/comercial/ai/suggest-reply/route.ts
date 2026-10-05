import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { getOpportunity, logActivity } from '@/lib/comercial/opportunities-server';
import { suggestWhatsAppReply, type SuggestReplyIntent } from '@/lib/comercial/ai-suggest';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bodySchema = z.object({
  opportunity_id: z.string().uuid(),
  intent: z.enum(['first_contact', 'follow_up', 'proposal', 'objection', 'close']),
});

export async function POST(request: NextRequest) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const opp = await getOpportunity(parsed.data.opportunity_id);
  if (!opp) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  let adisoDescription: string | undefined;
  if (opp.adiso_id) {
    const { data } = await supabaseAdmin
      .from('adisos')
      .select('descripcion')
      .eq('id', opp.adiso_id)
      .maybeSingle();
    adisoDescription = data?.descripcion as string | undefined;
  }

  const draft = await suggestWhatsAppReply(
    opp,
    parsed.data.intent as SuggestReplyIntent,
    adisoDescription,
  );

  await logActivity({
    opportunityId: opp.id,
    activityType: 'ai_draft',
    body: draft,
    createdBy: ops.id,
    metadata: { intent: parsed.data.intent },
  });

  return NextResponse.json({ draft, intent: parsed.data.intent });
}

export const dynamic = 'force-dynamic';
