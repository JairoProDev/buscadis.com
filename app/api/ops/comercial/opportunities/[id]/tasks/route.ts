import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { completeTask, createTask } from '@/lib/comercial/opportunities-server';

type RouteProps = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  title: z.string().min(1).max(300),
  due_at: z.string().datetime().optional(),
});

export async function POST(request: NextRequest, { params }: RouteProps) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const task = await createTask({
    opportunityId: id,
    title: parsed.data.title,
    dueAt: parsed.data.due_at,
    assignedTo: ops.id,
  });
  return NextResponse.json({ task }, { status: 201 });
}

export const dynamic = 'force-dynamic';
