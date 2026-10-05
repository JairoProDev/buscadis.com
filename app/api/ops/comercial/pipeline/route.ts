import { NextRequest, NextResponse } from 'next/server';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { getPipelineMetrics, listSalesStages } from '@/lib/comercial/opportunities-server';

export async function GET(request: NextRequest) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [stages, metrics] = await Promise.all([listSalesStages(), getPipelineMetrics()]);
  return NextResponse.json({ stages, metrics });
}

export const dynamic = 'force-dynamic';
