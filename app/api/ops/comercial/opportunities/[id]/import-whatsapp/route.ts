import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { getOpportunity } from '@/lib/comercial/opportunities-server';
import { importWhatsAppExportForOpportunity } from '@/lib/comercial/whatsapp-batch-import';
import { parseWhatsAppExportText } from '@/lib/comercial/whatsapp-export-parse';

type RouteProps = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  export_text: z.string().min(10).max(2_000_000),
  dry_run: z.boolean().optional(),
});

export async function POST(request: NextRequest, { params }: RouteProps) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Texto inválido' }, { status: 400 });
  }

  const outbound = (process.env.CRM_WA_OUTBOUND_NAMES || 'jairo,buscadis,publicadis,shantall,adis')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const messages = parseWhatsAppExportText(parsed.data.export_text, outbound);
  if (parsed.data.dry_run) {
    return NextResponse.json({
      preview: messages.slice(0, 5),
      total: messages.length,
      inbound: messages.filter((m) => m.direction === 'inbound').length,
      outbound: messages.filter((m) => m.direction === 'outbound').length,
    });
  }

  const imported = await importWhatsAppExportForOpportunity(
    id,
    parsed.data.export_text,
    ops.id,
    outbound,
  );

  return NextResponse.json({ imported, total: messages.length });
}

export const dynamic = 'force-dynamic';
