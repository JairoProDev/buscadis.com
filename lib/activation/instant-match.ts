import { supabaseAdmin } from '@/lib/supabase-admin';
import { matchInterestedUsers } from '@/lib/matching/server';
import { filterEligibleRecipients, buildOpportunityCopy } from '@/lib/notifications/intent-router';
import { createSupplyDemandMatches } from '@/lib/matching/server';
import { rebuildUserBehaviorProfile } from '@/lib/behavior/rebuild-profiles';
import { deliverOpportunityToUser } from '@/lib/notifications/delivery';
import { processBothPaidMatchesForSupplyAdiso } from '@/lib/matching/both-paid';

export async function runInstantMatchCampaign(params: {
  adisoId: string;
  advertiserUserId: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  ubicacion?: Record<string, unknown>;
}): Promise<{ notified: number; campaignId: string | null }> {
  const interested = await matchInterestedUsers(
    {
      categoria: params.categoria,
      titulo: params.titulo,
      descripcion: params.descripcion,
      ubicacion: params.ubicacion,
    },
    50
  );

  const eligible = await filterEligibleRecipients(interested);
  const copy = buildOpportunityCopy(params.titulo, eligible[0]?.matchReasons?.[0]);

  const { data: campaign, error: campErr } = await supabaseAdmin
    .from('notification_campaigns')
    .insert({
      campaign_type: 'instant_match',
      adiso_id: params.adisoId,
      advertiser_user_id: params.advertiserUserId,
      title: copy.title,
      body: copy.body,
      metadata: { interested_count: eligible.length },
      status: eligible.length > 0 ? 'sending' : 'completed',
    })
    .select('id')
    .single();

  if (campErr || !campaign) {
    console.error('[campaign] create error:', campErr?.message);
    return { notified: 0, campaignId: null };
  }

  let notified = 0;
  for (const user of eligible) {
    const result = await deliverOpportunityToUser({
      userId: user.userId,
      campaignId: campaign.id as string,
      title: copy.title,
      body: copy.body,
      adisoId: params.adisoId,
      matchScore: user.matchScore,
    });
    if (result.inApp) notified += 1;
  }

  await supabaseAdmin
    .from('notification_campaigns')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      metadata: { interested_count: eligible.length, notified },
    })
    .eq('id', campaign.id);

  await createSupplyDemandMatches(params.adisoId, {
    categoria: params.categoria,
    titulo: params.titulo,
    descripcion: params.descripcion,
    ubicacion: params.ubicacion,
  });

  await processBothPaidMatchesForSupplyAdiso(params.adisoId);

  await supabaseAdmin.rpc('fn_upsert_graph_node', {
    p_node_type: 'Ad',
    p_ref_id: params.adisoId,
    p_label: params.titulo,
    p_metadata: { categoria: params.categoria },
  });

  void rebuildUserBehaviorProfile(params.advertiserUserId);

  return { notified, campaignId: campaign.id as string };
}
