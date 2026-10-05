import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { createOpportunity, listOpportunities } from '@/lib/comercial/opportunities-server';

export async function GET(request: NextRequest) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const stageId = request.nextUrl.searchParams.get('stage') || undefined;
  const source = request.nextUrl.searchParams.get('source') || undefined;
  const campaign = request.nextUrl.searchParams.get('campaign') || undefined;
  const opportunities = await listOpportunities({ stageId, source, campaign, limit: 500 });
  return NextResponse.json({ opportunities });
}

const createSchema = z.object({
  title: z.string().min(2).max(200),
  source: z.string().optional(),
  adiso_id: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_whatsapp: z.string().optional(),
  contact_email: z.string().optional(),
  business_name: z.string().optional(),
  plan_tier: z.string().optional(),
  amount_pen: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const opp = await createOpportunity(
    {
      ...parsed.data,
      source: (parsed.data.source as import('@/lib/comercial/types').SalesOpportunitySource) || 'manual',
    },
    ops.id,
  );
  return NextResponse.json({ opportunity: opp }, { status: 201 });
}

export const dynamic = 'force-dynamic';
