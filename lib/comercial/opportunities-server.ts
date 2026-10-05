import { supabaseAdmin } from '@/lib/supabase-admin';
import type {
  SalesActivity,
  SalesOpportunity,
  SalesOpportunityWithAdiso,
  SalesPipelineMetrics,
  SalesStage,
  SalesStageId,
  SalesTask,
} from './types';
import { isClosedStage, normalizeWhatsApp } from './pipeline';

function rowToOpportunity(row: Record<string, unknown>): SalesOpportunity {
  return {
    id: String(row.id),
    title: String(row.title),
    stage_id: row.stage_id as SalesStageId,
    source: row.source as SalesOpportunity['source'],
    adiso_id: (row.adiso_id as string) || null,
    contact_name: (row.contact_name as string) || null,
    contact_phone: (row.contact_phone as string) || null,
    contact_whatsapp: (row.contact_whatsapp as string) || null,
    contact_email: (row.contact_email as string) || null,
    business_name: (row.business_name as string) || null,
    plan_tier: (row.plan_tier as string) || null,
    amount_pen: row.amount_pen != null ? Number(row.amount_pen) : null,
    currency: String(row.currency || 'PEN'),
    owner_user_id: (row.owner_user_id as string) || null,
    account_id: (row.account_id as string) || null,
    lost_reason: (row.lost_reason as string) || null,
    notes: (row.notes as string) || null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    stage_changed_at: String(row.stage_changed_at),
    won_at: (row.won_at as string) || null,
    lost_at: (row.lost_at as string) || null,
  };
}

export async function listSalesStages(): Promise<SalesStage[]> {
  const { data, error } = await supabaseAdmin
    .from('sales_stages')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []) as SalesStage[];
}

export async function listOpportunities(params?: {
  stageId?: string;
  source?: string;
  campaign?: string;
  limit?: number;
}): Promise<SalesOpportunityWithAdiso[]> {
  let q = supabaseAdmin
    .from('sales_opportunities')
    .select('*, adisos:adiso_id ( id, titulo, categoria, esta_activo, imagen_url )')
    .order('updated_at', { ascending: false });

  if (params?.stageId) q = q.eq('stage_id', params.stageId);
  if (params?.source) q = q.eq('source', params.source);
  if (params?.campaign) q = q.filter('metadata->>campaign', 'eq', params.campaign);
  if (params?.limit) q = q.limit(params.limit);

  const { data, error } = await q;
  if (error) throw error;

  return (data || []).map((row) => {
    const opp = rowToOpportunity(row as Record<string, unknown>);
    const adisoJoin = (row as { adisos?: Record<string, unknown> | null }).adisos;
    return {
      ...opp,
      adiso: adisoJoin
        ? {
            id: String(adisoJoin.id),
            titulo: String(adisoJoin.titulo),
            categoria: String(adisoJoin.categoria),
            esta_activo: Boolean(adisoJoin.esta_activo),
            imagen_url: (adisoJoin.imagen_url as string) || null,
          }
        : null,
    };
  });
}

export async function getOpportunity(id: string): Promise<SalesOpportunityWithAdiso | null> {
  const { data, error } = await supabaseAdmin
    .from('sales_opportunities')
    .select('*, adisos:adiso_id ( id, titulo, categoria, esta_activo, imagen_url, descripcion )')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown> & { adisos?: Record<string, unknown> | null };
  const opp = rowToOpportunity(row);
  const adisoJoin = row.adisos;
  return {
    ...opp,
    adiso: adisoJoin
      ? {
          id: String(adisoJoin.id),
          titulo: String(adisoJoin.titulo),
          categoria: String(adisoJoin.categoria),
          esta_activo: Boolean(adisoJoin.esta_activo),
          imagen_url: (adisoJoin.imagen_url as string) || null,
        }
      : null,
  };
}

export async function createOpportunity(
  input: Partial<SalesOpportunity> & { title: string },
  createdBy?: string,
): Promise<SalesOpportunity> {
  const now = new Date().toISOString();
  const payload = {
    title: input.title,
    stage_id: input.stage_id || 'nuevo',
    source: input.source || 'manual',
    adiso_id: input.adiso_id || null,
    contact_name: input.contact_name || null,
    contact_phone: input.contact_phone || null,
    contact_whatsapp: normalizeWhatsApp(input.contact_whatsapp || input.contact_phone),
    contact_email: input.contact_email || null,
    business_name: input.business_name || null,
    plan_tier: input.plan_tier || null,
    amount_pen: input.amount_pen ?? null,
    currency: input.currency || 'PEN',
    owner_user_id: input.owner_user_id || createdBy || null,
    notes: input.notes || null,
    metadata: input.metadata || {},
    updated_at: now,
    stage_changed_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from('sales_opportunities')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;

  const opp = rowToOpportunity(data as Record<string, unknown>);
  await logActivity({
    opportunityId: opp.id,
    activityType: 'note',
    body: 'Oportunidad creada',
    createdBy,
    metadata: { source: opp.source },
  });
  return opp;
}

export async function updateOpportunityStage(
  id: string,
  stageId: SalesStageId,
  actorId?: string,
  extra?: { lost_reason?: string; amount_pen?: number; plan_tier?: string },
): Promise<SalesOpportunity> {
  const existing = await getOpportunity(id);
  if (!existing) throw new Error('Oportunidad no encontrada');

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    stage_id: stageId,
    updated_at: now,
    stage_changed_at: now,
  };

  if (stageId === 'ganado') {
    updates.won_at = now;
    updates.lost_at = null;
    updates.lost_reason = null;
    if (extra?.amount_pen != null) updates.amount_pen = extra.amount_pen;
    if (extra?.plan_tier) updates.plan_tier = extra.plan_tier;
  } else if (stageId === 'perdido') {
    updates.lost_at = now;
    updates.won_at = null;
    if (extra?.lost_reason) updates.lost_reason = extra.lost_reason;
  }

  const { data, error } = await supabaseAdmin
    .from('sales_opportunities')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;

  const opp = rowToOpportunity(data as Record<string, unknown>);

  await logActivity({
    opportunityId: id,
    activityType: 'stage_change',
    body: `Etapa: ${existing.stage_id} → ${stageId}`,
    createdBy: actorId,
  });

  if (stageId === 'ganado') {
    await ensureAccountForWonOpportunity(opp, actorId);
  }

  return opp;
}

async function ensureAccountForWonOpportunity(opp: SalesOpportunity, actorId?: string) {
  if (opp.account_id) return;

  const displayName = opp.business_name || opp.contact_name || opp.title;
  const docsPath =
    typeof opp.metadata?.docs_path === 'string' ? opp.metadata.docs_path : null;

  const { data: account, error } = await supabaseAdmin
    .from('sales_accounts')
    .insert({
      display_name: displayName,
      contact_phone: opp.contact_phone,
      contact_whatsapp: opp.contact_whatsapp,
      contact_email: opp.contact_email,
      docs_path: docsPath,
      metadata: { opportunity_id: opp.id, adiso_id: opp.adiso_id },
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) throw error;

  await supabaseAdmin
    .from('sales_opportunities')
    .update({ account_id: account.id, updated_at: new Date().toISOString() })
    .eq('id', opp.id);

  await logActivity({
    opportunityId: opp.id,
    activityType: 'note',
    body: `Cuenta cliente creada (${account.id})`,
    createdBy: actorId,
  });
}

export async function patchOpportunity(
  id: string,
  patch: Partial<SalesOpportunity>,
): Promise<SalesOpportunity> {
  const allowed: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  const keys = [
    'title',
    'contact_name',
    'contact_phone',
    'contact_whatsapp',
    'contact_email',
    'business_name',
    'plan_tier',
    'amount_pen',
    'notes',
    'owner_user_id',
    'metadata',
  ] as const;
  for (const k of keys) {
    if (patch[k] !== undefined) allowed[k] = patch[k];
  }
  if (patch.contact_whatsapp || patch.contact_phone) {
    allowed.contact_whatsapp = normalizeWhatsApp(
      patch.contact_whatsapp || patch.contact_phone || null,
    );
  }

  const { data, error } = await supabaseAdmin
    .from('sales_opportunities')
    .update(allowed)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToOpportunity(data as Record<string, unknown>);
}

export async function logActivity(params: {
  opportunityId: string;
  activityType: SalesActivity['activity_type'];
  body?: string;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}): Promise<SalesActivity> {
  const { data, error } = await supabaseAdmin
    .from('sales_activities')
    .insert({
      opportunity_id: params.opportunityId,
      activity_type: params.activityType,
      body: params.body || null,
      created_by: params.createdBy || null,
      metadata: params.metadata || {},
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as SalesActivity;
}

export async function listActivities(opportunityId: string): Promise<SalesActivity[]> {
  const { data, error } = await supabaseAdmin
    .from('sales_activities')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as SalesActivity[];
}

export async function createTask(params: {
  opportunityId?: string;
  accountId?: string;
  title: string;
  dueAt?: string;
  assignedTo?: string;
}): Promise<SalesTask> {
  const { data, error } = await supabaseAdmin
    .from('sales_tasks')
    .insert({
      opportunity_id: params.opportunityId || null,
      account_id: params.accountId || null,
      title: params.title,
      due_at: params.dueAt || null,
      assigned_to: params.assignedTo || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as SalesTask;
}

export async function listTasks(opportunityId: string): Promise<SalesTask[]> {
  const { data, error } = await supabaseAdmin
    .from('sales_tasks')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('due_at', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data || []) as SalesTask[];
}

export async function completeTask(taskId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('sales_tasks')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
}

export async function getPipelineMetrics(): Promise<SalesPipelineMetrics> {
  const { data, error } = await supabaseAdmin.from('sales_opportunities').select('stage_id, amount_pen');
  if (error) throw error;

  const byStage: Record<string, number> = {};
  let amountOpenPen = 0;
  let amountWonPen = 0;
  let won = 0;
  let lost = 0;
  let open = 0;
  let total = 0;
  let contacted = 0;

  for (const row of data || []) {
    const stage = String(row.stage_id);
    byStage[stage] = (byStage[stage] || 0) + 1;
    total += 1;
    const amt = row.amount_pen != null ? Number(row.amount_pen) : 0;
    if (stage === 'ganado') {
      won += 1;
      amountWonPen += amt;
    } else if (stage === 'perdido') {
      lost += 1;
    } else {
      open += 1;
      amountOpenPen += amt;
      if (stage !== 'nuevo') contacted += 1;
    }
  }

  return {
    byStage,
    totals: { open, won, lost, amountOpenPen, amountWonPen },
    conversion: {
      contactedRate: total > 0 ? contacted / total : 0,
      wonRate: total > 0 ? won / total : 0,
    },
  };
}

export { isClosedStage };
