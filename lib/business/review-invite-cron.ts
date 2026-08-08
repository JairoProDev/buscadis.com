import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  crearTokenResenaInvite,
  rutaResenaInvite,
} from '@/lib/business/review-invite-token';
import { getSiteUrl } from '@/lib/seo/og-image';

const WINDOW_START_H = 72;
const WINDOW_END_H = 48;

/**
 * P10 cron lite: si hubo clics WA hace ~48–72h y no hay reseña nueva,
 * notifica al dueño con enlace listo para mandar (no escribe al cliente).
 */
export async function runReviewInviteNudges(opts?: {
  now?: Date;
  limit?: number;
}): Promise<{
  checked: number;
  nudged: number;
  skipped: number;
}> {
  if (!supabaseAdmin) {
    return { checked: 0, nudged: 0, skipped: 0 };
  }

  const now = opts?.now ?? new Date();
  const end = new Date(now.getTime() - WINDOW_END_H * 3_600_000);
  const start = new Date(now.getTime() - WINDOW_START_H * 3_600_000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3_600_000).toISOString();

  const { data: clicks, error } = await supabaseAdmin
    .from('page_analytics')
    .select('business_profile_id, created_at')
    .eq('event_type', 'whatsapp_click')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString())
    .limit(opts?.limit ?? 500);

  if (error) {
    console.error('[review-invite-cron] analytics', error.message);
    return { checked: 0, nudged: 0, skipped: 0 };
  }

  const byBusiness = new Map<string, number>();
  for (const row of clicks || []) {
    const id = row.business_profile_id as string;
    if (!id) continue;
    byBusiness.set(id, (byBusiness.get(id) || 0) + 1);
  }

  let nudged = 0;
  let skipped = 0;
  const site = getSiteUrl();

  for (const [businessId, waCount] of byBusiness) {
    const { data: profile } = await supabaseAdmin
      .from('business_profiles')
      .select('id, slug, name, user_id')
      .eq('id', businessId)
      .maybeSingle();

    if (!profile?.user_id || !profile.slug) {
      skipped += 1;
      continue;
    }

    const { count: reviewCount } = await supabaseAdmin
      .from('business_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('business_profile_id', businessId)
      .gte('created_at', start.toISOString());

    if ((reviewCount || 0) > 0) {
      skipped += 1;
      continue;
    }

    const { data: recentNudge } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', profile.user_id)
      .eq('type', 'system')
      .gte('created_at', weekAgo)
      .filter('data->>kind', 'eq', 'review_invite_nudge')
      .filter('data->>businessId', 'eq', profile.id)
      .limit(1)
      .maybeSingle();

    if (recentNudge) {
      skipped += 1;
      continue;
    }

    const token = crearTokenResenaInvite({
      negocioId: profile.id,
      slug: profile.slug,
      nombre: profile.name || 'tu negocio',
    });
    const inviteUrl = `${site}${rutaResenaInvite(token)}`;

    const { error: insertErr } = await supabaseAdmin.from('notifications').insert({
      user_id: profile.user_id,
      type: 'system',
      title: 'Pide reseñas a quien te escribió',
      message: `Hace ~2 días tuviste ${waCount} clic${waCount === 1 ? '' : 's'} a WhatsApp y aún no hay reseña nueva. Mándales este enlace de 5 segundos.`,
      data: {
        kind: 'review_invite_nudge',
        businessId: profile.id,
        slug: profile.slug,
        inviteUrl,
        waCount,
      },
      read: false,
    });

    if (insertErr) {
      console.error('[review-invite-cron] notify', insertErr.message);
      skipped += 1;
      continue;
    }
    nudged += 1;
  }

  return { checked: byBusiness.size, nudged, skipped };
}
