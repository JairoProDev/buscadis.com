import { supabaseAdmin } from '@/lib/supabase-admin';
import { dbToAdiso } from '@/lib/supabase';
import { FREE_TIER_LIMITS } from '@/lib/publish/tiers';
import { ensureRuedaAdvertiserUser } from '@/lib/rueda/ensure-advertiser';
import { onAdisoSearchIndexUpdate } from '@/lib/search/post-create';
import { RUEDA_R2764_BATCH_ID } from '@/lib/rueda/batch-constants';

const RUEDA_PIPELINE = 'rueda_claimable';

function limaNowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  return { fecha: `${get('year')}-${get('month')}-${get('day')}`, hora: `${get('hour')}:${get('minute')}` };
}

export async function activateScheduledRuedaAds(
  limit = 1,
  batchId?: string,
): Promise<{
  activated: string[];
  skipped: number;
  batch_id?: string;
}> {
  const now = new Date().toISOString();
  const filterBatch = batchId || process.env.RUEDA_ACTIVE_BATCH_ID || RUEDA_R2764_BATCH_ID;

  const privateFilter: Record<string, string> = { import_pipeline: RUEDA_PIPELINE };
  if (filterBatch) privateFilter.batch_id = filterBatch;

  const { data: candidates, error } = await supabaseAdmin
    .from('adisos')
    .select('*')
    .eq('esta_activo', false)
    .contains('private_data', privateFilter)
    .limit(500);

  if (error) throw new Error(error.message);

  const due = (candidates || [])
    .filter((row) => {
      const priv = (row.private_data || {}) as Record<string, unknown>;
      if (priv.go_live_completed_at) return false;
      const at = priv.scheduled_go_live_at as string | undefined;
      return at && at <= now;
    })
    .sort((a, b) => {
      const pa = ((a.private_data as Record<string, unknown>)?.scheduled_go_live_at as string) || '';
      const pb = ((b.private_data as Record<string, unknown>)?.scheduled_go_live_at as string) || '';
      return pa.localeCompare(pb);
    })
    .slice(0, limit);

  const activated: string[] = [];
  const { fecha, hora } = limaNowParts();
  const expiresAt = new Date(Date.now() + FREE_TIER_LIMITS.durationHours * 60 * 60 * 1000).toISOString();

  for (const row of due || []) {
    const priv = (row.private_data || {}) as Record<string, unknown>;
    if (priv.go_live_completed_at) continue;

    const phone =
      (row.contacto as string) ||
      (typeof row.contactos_multiples === 'string'
        ? JSON.parse(row.contactos_multiples)[0]?.valor
        : Array.isArray(row.contactos_multiples)
          ? row.contactos_multiples[0]?.valor
          : null);

    const ensured = await ensureRuedaAdvertiserUser({
      phone,
      displayName: (row.titulo as string)?.slice(0, 40) || 'Anunciante',
    });

    if (process.env.RUEDA_ENFORCE_ONE_FREE_ACTIVE === '1') {
      await supabaseAdmin
        .from('adisos')
        .update({ esta_activo: false })
        .eq('user_id', ensured.userId)
        .eq('esta_activo', true)
        .contains('private_data', { import_pipeline: RUEDA_PIPELINE })
        .neq('id', row.id);
    }

    const nextPrivate = {
      ...priv,
      go_live_completed_at: now,
      claim_republish_available: true,
    };

    const phoneDigits = (phone || (row.contacto as string) || '').replace(/\D/g, '').slice(-9);
    const contactosMultiples = phoneDigits
      ? [{ tipo: 'whatsapp', valor: phoneDigits, principal: true, etiqueta: 'WhatsApp' }]
      : null;

    const { error: upErr } = await supabaseAdmin
      .from('adisos')
      .update({
        esta_activo: true,
        user_id: ensured.userId,
        contacto: phoneDigits || row.contacto,
        contactos_multiples: contactosMultiples,
        fecha_publicacion: fecha,
        hora_publicacion: hora,
        expires_at: expiresAt,
        fecha_expiracion: expiresAt,
        contact_locked: false,
        promotion_rank: 0,
        promotion_tier: 'gratis',
        private_data: nextPrivate,
      })
      .eq('id', row.id)
      .eq('esta_activo', false);

    if (upErr) {
      console.error('[go-live] update failed', row.id, upErr.message);
      continue;
    }

    activated.push(row.id as string);
    if (process.env.OPENAI_API_KEY) {
      try {
        const adiso = dbToAdiso({ ...row, esta_activo: true, user_id: ensured.userId });
        await onAdisoSearchIndexUpdate(adiso);
      } catch (e) {
        console.warn('[go-live] index update', row.id, e);
      }
    }
  }

  return {
    activated,
    skipped: (due?.length || 0) - activated.length,
    batch_id: filterBatch,
  };
}

/** Republicación inmediata al reclamar (sube en feed). */
export async function applyClaimRepublish(adisoId: string, userId: string): Promise<boolean> {
  const { data: row, error } = await supabaseAdmin
    .from('adisos')
    .select('id, private_data, user_id')
    .eq('id', adisoId)
    .maybeSingle();

  if (error || !row) return false;
  const priv = (row.private_data || {}) as Record<string, unknown>;
  if (!priv.claim_republish_available) return false;

  const { fecha, hora } = limaNowParts();
  const expiresAt = new Date(Date.now() + FREE_TIER_LIMITS.durationHours * 60 * 60 * 1000).toISOString();

  const { error: upErr } = await supabaseAdmin
    .from('adisos')
    .update({
      user_id: userId,
      esta_activo: true,
      es_historico: false,
      contact_locked: false,
      fecha_publicacion: fecha,
      hora_publicacion: hora,
      promoted_at: new Date().toISOString(),
      promotion_rank: 1,
      expires_at: expiresAt,
      fecha_expiracion: expiresAt,
      private_data: {
        ...priv,
        claim_republish_available: false,
        claim_republish_used_at: new Date().toISOString(),
        pending_owner_transfer: false,
      },
    })
    .eq('id', adisoId);

  return !upErr;
}
