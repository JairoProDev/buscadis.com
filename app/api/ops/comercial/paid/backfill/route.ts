import { NextRequest, NextResponse } from 'next/server';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { backfillPaidClientBatches } from '@/lib/comercial/paid-client-sync';

export async function POST(request: NextRequest) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const result = await backfillPaidClientBatches(ops.id);
  return NextResponse.json(result);
}

export const dynamic = 'force-dynamic';
