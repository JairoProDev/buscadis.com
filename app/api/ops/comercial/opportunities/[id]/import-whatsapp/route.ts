import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { getOpportunity, logActivity } from '@/lib/comercial/opportunities-server';
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

  const outbound = (process.env.CRM_WA_OUTBOUND_NAMES || 'jairo,buscadis,shantall,adis')
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

  let imported = 0;
  for (const msg of messages) {
    if (msg.direction === 'system') {
      await logActivity({
        opportunityId: id,
        activityType: 'note',
        body: `[WA sistema] ${msg.body.slice(0, 2000)}`,
        createdBy: ops.id,
        metadata: { wa_import: true, at: msg.at, sender: msg.sender },
      });
    } else {
      await logActivity({
        opportunityId: id,
        activityType:
          msg.direction === 'outbound' ? 'whatsapp_outbound' : 'whatsapp_inbound',
        body: msg.body.slice(0, 4000),
        createdBy: ops.id,
        metadata: { wa_import: true, at: msg.at, sender: msg.sender },
      });
    }
    imported += 1;
  }

  await logActivity({
    opportunityId: id,
    activityType: 'note',
    body: `Importación WhatsApp: ${imported} mensajes registrados`,
    createdBy: ops.id,
    metadata: { wa_import_batch: true },
  });

  return NextResponse.json({ imported, total: messages.length });
}

export const dynamic = 'force-dynamic';
