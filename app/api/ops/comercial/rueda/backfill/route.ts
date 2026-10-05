import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { backfillOpportunitiesFromBatch } from '@/lib/comercial/rueda-sync';
import { RUEDA_R2764_BATCH_ID } from '@/lib/rueda/batch-constants';

const bodySchema = z.object({
  batch_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  const batchId = parsed.success && parsed.data.batch_id ? parsed.data.batch_id : RUEDA_R2764_BATCH_ID;

  const result = await backfillOpportunitiesFromBatch(batchId, ops.id);
  return NextResponse.json({ batchId, ...result });
}

export const dynamic = 'force-dynamic';
