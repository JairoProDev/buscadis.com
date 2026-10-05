import { NextRequest, NextResponse } from 'next/server';
import { requireOpsUser } from '@/lib/ops/require-ops';
import { importWhatsAppExportFile } from '@/lib/comercial/whatsapp-batch-import';

export async function POST(request: NextRequest) {
  const ops = await requireOpsUser(request);
  if (!ops) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const form = await request.formData();
  const files = form.getAll('files');
  if (!files.length) {
    return NextResponse.json({ error: 'Sin archivos' }, { status: 400 });
  }

  const results: Awaited<ReturnType<typeof importWhatsAppExportFile>>[] = [];
  for (const entry of files) {
    if (!(entry instanceof File)) continue;
    const text = await entry.text();
    if (text.length < 10) {
      results.push({
        filename: entry.name,
        opportunityId: null,
        imported: 0,
        error: 'Archivo vacío',
      });
      continue;
    }
    results.push(await importWhatsAppExportFile(entry.name, text, ops.id));
  }

  const imported = results.reduce((s, r) => s + r.imported, 0);
  return NextResponse.json({ imported, files: results.length, results });
}

export const dynamic = 'force-dynamic';
