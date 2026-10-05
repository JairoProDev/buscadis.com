import { NextRequest, NextResponse } from 'next/server';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { completeTask } from '@/lib/comercial/opportunities-server';

type RouteProps = { params: Promise<{ taskId: string }> };

export async function POST(request: NextRequest, { params }: RouteProps) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { taskId } = await params;
  await completeTask(taskId);
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
