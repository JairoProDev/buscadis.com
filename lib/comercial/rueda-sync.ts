import { supabaseAdmin } from '@/lib/supabase-admin';
import { createOpportunity } from './opportunities-server';
import { normalizeWhatsApp } from './pipeline';
import type { SalesOpportunity } from './types';

export async function opportunityExistsForAdiso(adisoId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('sales_opportunities')
    .select('id')
    .eq('adiso_id', adisoId)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function createOpportunityFromAdisoLead(
  adisoId: string,
  ownerUserId?: string,
): Promise<SalesOpportunity | null> {
  if (await opportunityExistsForAdiso(adisoId)) return null;

  const { data: row, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, contacto, contactos_multiples, private_data, categoria')
    .eq('id', adisoId)
    .maybeSingle();
  if (error || !row) return null;

  const priv =
    row.private_data && typeof row.private_data === 'object'
      ? (row.private_data as Record<string, unknown>)
      : {};

  let whatsapp = String(row.contacto || '');
  const cms = row.contactos_multiples;
  if (Array.isArray(cms)) {
    const wa = cms.find(
      (c: { tipo?: string; principal?: boolean }) =>
        c.tipo === 'whatsapp' || c.tipo === 'telefono',
    ) as { valor?: string } | undefined;
    if (wa?.valor) whatsapp = wa.valor;
  }

  const batchId = typeof priv.batch_id === 'string' ? priv.batch_id : '';
  const source = batchId.startsWith('rueda') ? 'rueda' : 'manual';

  return createOpportunity(
    {
      title: String(row.titulo || 'Lead sin título'),
      adiso_id: adisoId,
      source,
      contact_whatsapp: normalizeWhatsApp(whatsapp),
      contact_phone: whatsapp,
      business_name: typeof priv.client_name === 'string' ? priv.client_name : null,
      notes: batchId ? `Batch: ${batchId}` : undefined,
      metadata: { batch_id: batchId, categoria: row.categoria },
      owner_user_id: ownerUserId,
    },
    ownerUserId,
  );
}

export async function backfillOpportunitiesFromBatch(
  batchId: string,
  ownerUserId?: string,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const { data: adisos, error } = await supabaseAdmin
    .from('adisos')
    .select('id')
    .filter('private_data->>batch_id', 'eq', batchId);
  if (error) throw error;

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of adisos || []) {
    try {
      const opp = await createOpportunityFromAdisoLead(row.id, ownerUserId);
      if (opp) created += 1;
      else skipped += 1;
    } catch (e) {
      errors.push(`${row.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { created, skipped, errors };
}
