import { supabaseAdmin } from '@/lib/supabase-admin';
import { onAdisoSearchIndexUpdate } from '@/lib/search/post-create';
import type { Categoria } from '@/types';

export type ScheduledPromotionBump = {
  at: string;
  kind?: string;
  story?: boolean;
  applied_at?: string;
};

function parseBumps(priv: Record<string, unknown>): ScheduledPromotionBump[] {
  const raw = priv.promotion_bumps;
  if (!Array.isArray(raw)) return [];
  return raw.filter((b) => b && typeof b === 'object' && typeof (b as ScheduledPromotionBump).at === 'string') as ScheduledPromotionBump[];
}

/**
 * Aplica bumps programados (p. ej. resubida día 3): actualiza promoted_at y opcionalmente renueva historia.
 */
export async function applyDuePromotionBumps(now = new Date()): Promise<{
  scanned: number;
  applied: number;
  details: { adisoId: string; kind: string }[];
}> {
  const { data: rows, error } = await supabaseAdmin
    .from('adisos')
    .select('id, user_id, titulo, categoria, imagen_url, promotion_expires_at, private_data')
    .eq('esta_activo', true)
    .not('private_data', 'is', null);

  if (error) throw error;

  const details: { adisoId: string; kind: string }[] = [];
  let applied = 0;

  for (const row of rows || []) {
    const priv =
      row.private_data && typeof row.private_data === 'object'
        ? { ...(row.private_data as Record<string, unknown>) }
        : null;
    if (!priv) continue;

    const bumps = parseBumps(priv);
    if (!bumps.length) continue;

    let changed = false;
    const nowIso = now.toISOString();

    for (const bump of bumps) {
      if (bump.applied_at) continue;
      if (new Date(bump.at).getTime() > now.getTime()) continue;

      const expires = row.promotion_expires_at as string | null;
      if (expires && new Date(expires).getTime() < now.getTime()) continue;

      await supabaseAdmin
        .from('adisos')
        .update({ promoted_at: nowIso })
        .eq('id', row.id);

      if (bump.story) {
        const mediaUrl = row.imagen_url as string | undefined;
        if (mediaUrl && row.user_id) {
          await supabaseAdmin
            .from('stories')
            .update({ status: 'archived', archived_at: nowIso })
            .eq('adiso_id', row.id)
            .eq('status', 'active');

          const visibleUntil = expires || new Date(now.getTime() + 7 * 86400000).toISOString();
          await supabaseAdmin.from('stories').insert({
            user_id: row.user_id,
            media_url: mediaUrl,
            media_type: 'image',
            caption: row.titulo,
            categoria: row.categoria,
            adiso_id: row.id,
            promotion_tier: 'destacada',
            objective: 'contactos',
            source: 'adiso_auto',
            status: 'active',
            visible_until: visibleUntil,
            expires_at: visibleUntil,
            sort_order: 0,
          });
        }
      }

      bump.applied_at = nowIso;
      changed = true;
      applied += 1;
      details.push({ adisoId: row.id, kind: bump.kind || 'bump' });

      onAdisoSearchIndexUpdate({
        id: row.id,
        titulo: String(row.titulo || ''),
        categoria: (row.categoria || 'empleos') as Categoria,
      });
    }

    if (changed) {
      priv.promotion_bumps = bumps;
      await supabaseAdmin.from('adisos').update({ private_data: priv }).eq('id', row.id);
    }
  }

  return { scanned: rows?.length || 0, applied, details };
}
