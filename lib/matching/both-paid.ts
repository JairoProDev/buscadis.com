import { supabaseAdmin } from '@/lib/supabase-admin';
import { deliverOpportunityToUser } from '@/lib/notifications/delivery';

async function isAdisoPaid(adisoId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('adiso_package_orders')
    .select('status')
    .eq('adiso_id', adisoId)
    .in('status', ['paid', 'dev_bypass'])
    .maybeSingle();
  return Boolean(data);
}

async function notifyConnection(params: {
  userId: string;
  adisoId: string;
  otherTitle: string;
  matchScore: number;
}): Promise<void> {
  const { data: campaign } = await supabaseAdmin
    .from('notification_campaigns')
    .insert({
      campaign_type: 'cross_match',
      adiso_id: params.adisoId,
      title: '¡Conexión instantánea!',
      body: `Encontramos a alguien compatible con lo que buscas: ${params.otherTitle}`,
      metadata: { match_score: params.matchScore },
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (!campaign?.id) return;

  await deliverOpportunityToUser({
    userId: params.userId,
    campaignId: campaign.id as string,
    title: '¡Conexión instantánea!',
    body: `Alguien que busca lo que ofreces coincide con tu búsqueda: ${params.otherTitle}`,
    adisoId: params.adisoId,
    matchScore: params.matchScore,
  });
}

export async function processBothPaidMatchesForSupplyAdiso(supplyAdisoId: string): Promise<number> {
  const { data: supplyAd } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, user_id')
    .eq('id', supplyAdisoId)
    .maybeSingle();

  if (!supplyAd) return 0;

  const supplyPaid = await isAdisoPaid(supplyAdisoId);
  if (!supplyPaid) return 0;

  const { data: matches } = await supabaseAdmin
    .from('supply_demand_matches')
    .select('id, demand_intent_id, demand_adiso_id, match_score, status')
    .eq('supply_adiso_id', supplyAdisoId)
    .in('status', ['pending', 'notified']);

  let connected = 0;

  for (const match of matches || []) {
    let demandAdisoId = match.demand_adiso_id as string | null;
    let demandUserId: string | null = null;

    if (match.demand_intent_id) {
      const { data: intent } = await supabaseAdmin
        .from('demand_intents')
        .select('converted_adiso_id, user_id')
        .eq('id', match.demand_intent_id)
        .maybeSingle();

      demandUserId = intent?.user_id || null;
      demandAdisoId = demandAdisoId || intent?.converted_adiso_id || null;
    }

    if (!demandAdisoId) {
      await supabaseAdmin
        .from('supply_demand_matches')
        .update({ status: 'notified', notified_at: new Date().toISOString() })
        .eq('id', match.id);
      continue;
    }

    const demandPaid = await isAdisoPaid(demandAdisoId);
    if (!demandPaid) {
      await supabaseAdmin
        .from('supply_demand_matches')
        .update({ status: 'notified', notified_at: new Date().toISOString() })
        .eq('id', match.id);
      continue;
    }

    const { data: demandAd } = await supabaseAdmin
      .from('adisos')
      .select('titulo, user_id')
      .eq('id', demandAdisoId)
      .maybeSingle();

    await supabaseAdmin
      .from('supply_demand_matches')
      .update({
        status: 'connected',
        demand_adiso_id: demandAdisoId,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    const score = (match.match_score as number) || 0.5;

    if (demandUserId || demandAd?.user_id) {
      await notifyConnection({
        userId: (demandUserId || demandAd?.user_id) as string,
        adisoId: supplyAdisoId,
        otherTitle: supplyAd.titulo,
        matchScore: score,
      });
    }

    if (supplyAd.user_id && demandAd?.titulo) {
      await notifyConnection({
        userId: supplyAd.user_id,
        adisoId: demandAdisoId,
        otherTitle: demandAd.titulo,
        matchScore: score,
      });
    }

    connected += 1;
  }

  return connected;
}

export async function linkDemandIntentToAdiso(intentId: string, adisoId: string): Promise<void> {
  await supabaseAdmin
    .from('demand_intents')
    .update({
      status: 'converted_to_ad',
      converted_adiso_id: adisoId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', intentId);

  await supabaseAdmin
    .from('supply_demand_matches')
    .update({ demand_adiso_id: adisoId, updated_at: new Date().toISOString() })
    .eq('demand_intent_id', intentId);
}

export async function linkUserDemandIntentOnPublish(
  userId: string,
  adisoId: string,
  categoria: string
): Promise<string | null> {
  const { data: intent } = await supabaseAdmin
    .from('demand_intents')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('categoria', categoria)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!intent?.id) return null;

  await linkDemandIntentToAdiso(intent.id as string, adisoId);
  return intent.id as string;
}

export async function processBothPaidMatchesForDemandAdiso(demandAdisoId: string): Promise<number> {
  const demandPaid = await isAdisoPaid(demandAdisoId);
  if (!demandPaid) return 0;

  const { data: demandAd } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, user_id')
    .eq('id', demandAdisoId)
    .maybeSingle();

  if (!demandAd) return 0;

  const { data: matches } = await supabaseAdmin
    .from('supply_demand_matches')
    .select('id, supply_adiso_id, match_score, status')
    .eq('demand_adiso_id', demandAdisoId)
    .in('status', ['pending', 'notified']);

  let connected = 0;

  for (const match of matches || []) {
    const supplyAdisoId = match.supply_adiso_id as string;
    if (!supplyAdisoId) continue;

    const supplyPaid = await isAdisoPaid(supplyAdisoId);
    if (!supplyPaid) {
      await supabaseAdmin
        .from('supply_demand_matches')
        .update({ status: 'notified', notified_at: new Date().toISOString() })
        .eq('id', match.id);
      continue;
    }

    const { data: supplyAd } = await supabaseAdmin
      .from('adisos')
      .select('titulo, user_id')
      .eq('id', supplyAdisoId)
      .maybeSingle();

    await supabaseAdmin
      .from('supply_demand_matches')
      .update({
        status: 'connected',
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', match.id);

    const score = (match.match_score as number) || 0.5;

    if (demandAd.user_id && supplyAd?.titulo) {
      await notifyConnection({
        userId: demandAd.user_id,
        adisoId: supplyAdisoId,
        otherTitle: supplyAd.titulo,
        matchScore: score,
      });
    }

    if (supplyAd?.user_id && demandAd.titulo) {
      await notifyConnection({
        userId: supplyAd.user_id,
        adisoId: demandAdisoId,
        otherTitle: demandAd.titulo,
        matchScore: score,
      });
    }

    connected += 1;
  }

  return connected;
}
