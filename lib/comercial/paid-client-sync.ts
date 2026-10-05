import { supabaseAdmin } from '@/lib/supabase-admin';
import { createOpportunity, getOpportunity, patchOpportunity, updateOpportunityStage } from './opportunities-server';
import { opportunityExistsForAdiso } from './rueda-sync';
import { normalizeWhatsApp } from './pipeline';
import type { SalesOpportunity } from './types';

/** batch_id en `adisos.private_data` → carpeta en repo */
export const PAID_CLIENT_BATCH_DOCS: Record<string, string> = {
  'cliente-restaurante-mapacho-2026-10': 'docs/clientes/restaurante-mapacho',
  'cliente-cooperativa-supervisor-ventas-2026-10': 'docs/clientes/cooperativa-supervisor-ventas',
  'cliente-mozos-steward-magisterio-2026-10': 'docs/clientes/mozos-steward-magisterio',
};

/** Un solo lead CRM por cliente multi-aviso (p. ej. Mapacho). */
const CRM_PRIMARY_JOB_SLUG: Record<string, string> = {
  'cliente-restaurante-mapacho-2026-10': 'principal-8-vacantes',
};

function isCrmPrimaryForBatch(priv: Record<string, unknown>, batchId: string): boolean {
  const requiredSlug = CRM_PRIMARY_JOB_SLUG[batchId];
  if (!requiredSlug) return true;
  return priv.job_slug === requiredSlug;
}

function readPrivate(adiso: { private_data?: unknown }) {
  return adiso.private_data && typeof adiso.private_data === 'object'
    ? (adiso.private_data as Record<string, unknown>)
    : {};
}

async function setAccountDocsPath(accountId: string, docsPath: string) {
  await supabaseAdmin
    .from('sales_accounts')
    .update({ docs_path: docsPath, updated_at: new Date().toISOString() })
    .eq('id', accountId);
}

/**
 * Registra en CRM un aviso de cliente con plan pagado (etapa ganado + cuenta).
 */
export async function syncPaidClientAdisoToCrm(
  adisoId: string,
  ownerUserId?: string,
): Promise<SalesOpportunity | null> {
  const { data: row, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, contacto, contactos_multiples, private_data, features')
    .eq('id', adisoId)
    .maybeSingle();
  if (error || !row) return null;

  const priv = readPrivate(row);
  const batchId = typeof priv.batch_id === 'string' ? priv.batch_id : '';
  if (batchId && !isCrmPrimaryForBatch(priv, batchId)) return null;
  const docsPath =
    (typeof priv.client_docs_path === 'string' ? priv.client_docs_path : null) ||
    PAID_CLIENT_BATCH_DOCS[batchId] ||
    null;

  let whatsapp = String(row.contacto || '');
  const cms = row.contactos_multiples;
  if (Array.isArray(cms)) {
    const wa = cms.find(
      (c: { tipo?: string }) => c.tipo === 'whatsapp' || c.tipo === 'telefono',
    ) as { valor?: string } | undefined;
    if (wa?.valor) whatsapp = wa.valor;
  }

  const features =
    row.features && typeof row.features === 'object'
      ? (row.features as Record<string, unknown>)
      : {};
  const amountPen =
    priv.plan_amount_pen != null
      ? Number(priv.plan_amount_pen)
      : features.total_amount != null
        ? Number(features.total_amount)
        : null;
  const planTier =
    (typeof priv.plan_tier === 'string' ? priv.plan_tier : null) ||
    (typeof features.plan_comercial === 'string' ? features.plan_comercial : null) ||
    'destacado';

  const metadata = {
    batch_id: batchId,
    docs_path: docsPath,
    paid_client: true,
  };

  let oppId: string;

  if (await opportunityExistsForAdiso(adisoId)) {
    const { data: oppRow } = await supabaseAdmin
      .from('sales_opportunities')
      .select('id')
      .eq('adiso_id', adisoId)
      .maybeSingle();
    if (!oppRow?.id) return null;
    oppId = oppRow.id;
    await patchOpportunity(oppId, {
      business_name:
        typeof priv.client_name === 'string' ? priv.client_name : undefined,
      amount_pen: amountPen,
      plan_tier: planTier,
      metadata,
    });
  } else {
    const created = await createOpportunity(
      {
        title: String(row.titulo || 'Cliente pagado'),
        adiso_id: adisoId,
        source: 'cliente_existente',
        contact_whatsapp: normalizeWhatsApp(whatsapp),
        contact_phone: whatsapp,
        business_name: typeof priv.client_name === 'string' ? priv.client_name : null,
        plan_tier: planTier,
        amount_pen: amountPen,
        notes: batchId ? `Cliente pagado · ${batchId}` : 'Cliente pagado',
        metadata,
        owner_user_id: ownerUserId,
      },
      ownerUserId,
    );
    oppId = created.id;
  }

  const opp = await updateOpportunityStage(oppId, 'ganado', ownerUserId, {
    amount_pen: amountPen ?? undefined,
    plan_tier: planTier,
  });

  if (docsPath && opp.account_id) {
    await setAccountDocsPath(opp.account_id, docsPath);
  }

  return getOpportunity(oppId);
}

export async function backfillPaidClientBatches(
  ownerUserId?: string,
): Promise<{ synced: number; errors: string[] }> {
  const batchIds = Object.keys(PAID_CLIENT_BATCH_DOCS);
  let synced = 0;
  const errors: string[] = [];

  for (const batchId of batchIds) {
    const { data: adisos, error } = await supabaseAdmin
      .from('adisos')
      .select('id, private_data')
      .filter('private_data->>batch_id', 'eq', batchId);
    if (error) {
      errors.push(`${batchId}: ${error.message}`);
      continue;
    }
    for (const row of adisos || []) {
      const priv = readPrivate(row);
      if (!isCrmPrimaryForBatch(priv, batchId)) continue;
      try {
        const r = await syncPaidClientAdisoToCrm(row.id, ownerUserId);
        if (r) synced += 1;
      } catch (e) {
        errors.push(`${row.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return { synced, errors };
}
