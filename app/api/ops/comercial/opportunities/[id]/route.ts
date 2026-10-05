import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOpsUser } from '@/lib/ops/require-ops';
import {
  getOpportunity,
  listActivities,
  listTasks,
  patchOpportunity,
  updateOpportunityStage,
} from '@/lib/comercial/opportunities-server';
import type { SalesStageId } from '@/lib/comercial/types';
import { SALES_STAGE_IDS } from '@/lib/comercial/types';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteProps) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const opportunity = await getOpportunity(id);
  if (!opportunity) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const [activities, tasks] = await Promise.all([listActivities(id), listTasks(id)]);
  return NextResponse.json({ opportunity, activities, tasks });
}

const patchSchema = z.object({
  title: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_whatsapp: z.string().optional(),
  contact_email: z.string().optional(),
  business_name: z.string().optional(),
  plan_tier: z.string().optional(),
  amount_pen: z.number().nullable().optional(),
  notes: z.string().optional(),
  stage_id: z.enum(SALES_STAGE_IDS).optional(),
  lost_reason: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  if (parsed.data.stage_id) {
    const opp = await updateOpportunityStage(
      id,
      parsed.data.stage_id as SalesStageId,
      ops.id,
      {
        lost_reason: parsed.data.lost_reason,
        amount_pen: parsed.data.amount_pen ?? undefined,
        plan_tier: parsed.data.plan_tier,
      },
    );
    return NextResponse.json({ opportunity: opp });
  }

  const { stage_id: _, lost_reason: __, ...rest } = parsed.data;
  const opp = await patchOpportunity(id, rest);
  return NextResponse.json({ opportunity: opp });
}

export const dynamic = 'force-dynamic';
