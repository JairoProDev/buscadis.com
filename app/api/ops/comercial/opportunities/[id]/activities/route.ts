import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { logActivity } from '@/lib/comercial/opportunities-server';

type RouteProps = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  activity_type: z.enum([
    'note',
    'whatsapp_outbound',
    'whatsapp_inbound',
    'call',
    'email',
    'payment_recorded',
    'meeting',
    'ai_draft',
  ]),
  body: z.string().max(8000).optional(),
});

export async function POST(request: NextRequest, { params }: RouteProps) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const activity = await logActivity({
    opportunityId: id,
    activityType: parsed.data.activity_type,
    body: parsed.data.body,
    createdBy: ops.id,
  });
  return NextResponse.json({ activity }, { status: 201 });
}

export const dynamic = 'force-dynamic';
