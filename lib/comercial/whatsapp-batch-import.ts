import { supabaseAdmin } from '@/lib/supabase-admin';
import { CAMPANA_RUEDA_OCT_2026 } from './campana-rueda-oct-2026';
import { logActivity } from './opportunities-server';
import { normalizeWhatsApp } from './pipeline';
import { parseWhatsAppExportText } from './whatsapp-export-parse';

/** Extrae 9 dígitos peruanos del nombre de archivo: 984759634-mapacho.txt */
export function phoneFromExportFilename(name: string): string | null {
  const base = name.replace(/\.[^.]+$/, '');
  const m = base.match(/(\d{9})/);
  return m ? normalizeWhatsApp(m[1]) : null;
}

async function findOpportunityByPhone(whatsapp: string): Promise<string | null> {
  const { data: camp } = await supabaseAdmin
    .from('sales_opportunities')
    .select('id')
    .eq('contact_whatsapp', whatsapp)
    .filter('metadata->>campaign', 'eq', CAMPANA_RUEDA_OCT_2026)
    .maybeSingle();
  if (camp?.id) return camp.id;

  const { data: any } = await supabaseAdmin
    .from('sales_opportunities')
    .select('id')
    .eq('contact_whatsapp', whatsapp)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return any?.id ?? null;
}

export async function importWhatsAppExportForOpportunity(
  opportunityId: string,
  exportText: string,
  actorId?: string,
  outboundNames?: string[],
): Promise<number> {
  const outbound =
    outboundNames ||
    (process.env.CRM_WA_OUTBOUND_NAMES || 'jairo,buscadis,shantall,adis')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const messages = parseWhatsAppExportText(exportText, outbound);
  let imported = 0;
  for (const msg of messages) {
    if (msg.direction === 'system') {
      await logActivity({
        opportunityId,
        activityType: 'note',
        body: `[WA] ${msg.body.slice(0, 2000)}`,
        createdBy: actorId,
        metadata: { wa_import: true, at: msg.at, sender: msg.sender },
      });
    } else {
      await logActivity({
        opportunityId,
        activityType:
          msg.direction === 'outbound' ? 'whatsapp_outbound' : 'whatsapp_inbound',
        body: msg.body.slice(0, 4000),
        createdBy: actorId,
        metadata: { wa_import: true, at: msg.at, sender: msg.sender },
      });
    }
    imported += 1;
  }
  if (imported > 0) {
    await logActivity({
      opportunityId,
      activityType: 'note',
      body: `Importación masiva: ${imported} mensajes`,
      createdBy: actorId,
      metadata: { wa_import_batch: true },
    });
  }
  return imported;
}

export async function importWhatsAppExportFile(
  filename: string,
  exportText: string,
  actorId?: string,
): Promise<{ filename: string; opportunityId: string | null; imported: number; error?: string }> {
  const phone = phoneFromExportFilename(filename);
  if (!phone) {
    return { filename, opportunityId: null, imported: 0, error: 'Nombre sin número (usa 984759634-cliente.txt)' };
  }
  const oppId = await findOpportunityByPhone(phone);
  if (!oppId) {
    return { filename, opportunityId: null, imported: 0, error: `Sin oportunidad para ${phone}` };
  }
  const imported = await importWhatsAppExportForOpportunity(oppId, exportText, actorId);
  return { filename, opportunityId: oppId, imported };
}
