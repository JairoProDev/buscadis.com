import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  CAMPANA_RUEDA_OCT_2026,
  campanaEtapaToStage,
  type CampanaProspectInput,
} from './campana-rueda-oct-2026';
import { createOpportunity, logActivity, patchOpportunity } from './opportunities-server';
import { normalizeWhatsApp } from './pipeline';
import type { SalesOpportunity } from './types';

async function findByCampaignPhone(
  campaign: string,
  whatsapp: string,
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('sales_opportunities')
    .select('id')
    .eq('contact_whatsapp', whatsapp)
    .filter('metadata->>campaign', 'eq', campaign)
    .maybeSingle();
  return data?.id ?? null;
}

async function findAnyByPhone(whatsapp: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('sales_opportunities')
    .select('id, metadata')
    .eq('contact_whatsapp', whatsapp)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.id) return null;
  const meta = (data.metadata as Record<string, unknown>) || {};
  if (meta.campaign && meta.campaign !== CAMPANA_RUEDA_OCT_2026) return null;
  return data.id;
}

function buildNotes(p: CampanaProspectInput): string {
  const parts = [
    p.plan && `Plan: ${p.plan}`,
    p.ultimo_movimiento && `Último: ${p.ultimo_movimiento}`,
    p.proxima_accion && `Próxima: ${p.proxima_accion}`,
    p.contact_handle && `Contacto: ${p.contact_handle}`,
    p.notas_extra,
  ].filter(Boolean);
  return parts.join('\n');
}

function buildMetadata(p: CampanaProspectInput) {
  return {
    campaign: CAMPANA_RUEDA_OCT_2026,
    campana_etapa: p.etapa_label,
    campana_segment: p.segment,
    contact_handle: p.contact_handle || null,
    plan_resumen: p.plan || null,
    proxima_accion: p.proxima_accion || null,
    imported_from: 'campana-rueda-oct-2026-doc',
  };
}

export async function upsertCampanaProspect(
  p: CampanaProspectInput,
  actorId?: string,
): Promise<{ id: string; created: boolean }> {
  const wa = normalizeWhatsApp(p.contact_whatsapp);
  const stageId = campanaEtapaToStage(p.etapa_label);
  const notes = buildNotes(p);
  const metadata = buildMetadata(p);

  let oppId: string | null = null;
  if (wa) {
    oppId = await findByCampaignPhone(CAMPANA_RUEDA_OCT_2026, wa);
    if (!oppId) oppId = await findAnyByPhone(wa);
  } else {
    const { data } = await supabaseAdmin
      .from('sales_opportunities')
      .select('id')
      .eq('title', p.title)
      .filter('metadata->>campaign', 'eq', CAMPANA_RUEDA_OCT_2026)
      .maybeSingle();
    oppId = data?.id ?? null;
  }

  if (oppId) {
    await patchOpportunity(oppId, {
      title: p.title,
      business_name: p.business_name || p.title,
      contact_name: p.contact_name,
      contact_whatsapp: wa,
      contact_phone: p.contact_whatsapp,
      plan_tier: p.plan?.slice(0, 80) || undefined,
      amount_pen: p.amount_pen ?? undefined,
      notes,
      metadata,
    });
    await supabaseAdmin
      .from('sales_opportunities')
      .update({
        stage_id: stageId,
        updated_at: new Date().toISOString(),
        ...(stageId === 'ganado' ? { won_at: new Date().toISOString() } : {}),
        ...(stageId === 'perdido' && p.etapa_label === 'PAUSA'
          ? { lost_reason: 'pausa_sin_respuesta', lost_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', oppId);

    await logActivity({
      opportunityId: oppId,
      activityType: 'note',
      body: `[Sinc campaña] Etapa ${p.etapa_label}. ${p.ultimo_movimiento || ''}`.trim(),
      createdBy: actorId,
      metadata: { campana_sync: true },
    });
    return { id: oppId, created: false };
  }

  const created = await createOpportunity(
    {
      title: p.title,
      source: 'manual',
      contact_name: p.contact_name,
      contact_whatsapp: wa,
      contact_phone: p.contact_whatsapp,
      business_name: p.business_name || p.title,
      plan_tier: p.plan?.slice(0, 80),
      amount_pen: p.amount_pen,
      notes,
      metadata,
      stage_id: stageId,
    },
    actorId,
  );

  if (stageId !== 'nuevo' && stageId !== created.stage_id) {
    await supabaseAdmin
      .from('sales_opportunities')
      .update({ stage_id: stageId, stage_changed_at: new Date().toISOString() })
      .eq('id', created.id);
  }

  return { id: created.id, created: true };
}

export async function importCampanaProspects(
  prospects: CampanaProspectInput[],
  actorId?: string,
): Promise<{ created: number; updated: number; errors: string[] }> {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const p of prospects) {
    try {
      const r = await upsertCampanaProspect(p, actorId);
      if (r.created) created += 1;
      else updated += 1;
    } catch (e) {
      errors.push(`${p.title}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { created, updated, errors };
}
