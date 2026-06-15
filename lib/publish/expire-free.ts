import { supabaseAdmin } from '@/lib/supabase-admin';

export async function expireFreeAds(): Promise<{ ads: number; stories: number }> {
  const now = new Date().toISOString();

  const { data: expiredAds } = await supabaseAdmin
    .from('adisos')
    .select('id')
    .eq('publish_tier', 'free')
    .eq('esta_activo', true)
    .not('expires_at', 'is', null)
    .lt('expires_at', now);

  let ads = 0;
  for (const row of expiredAds || []) {
    const { error } = await supabaseAdmin
      .from('adisos')
      .update({ esta_activo: false, es_historico: true })
      .eq('id', row.id);
    if (!error) ads += 1;
  }

  const { data: expiredStories } = await supabaseAdmin
    .from('stories')
    .select('id')
    .eq('status', 'active')
    .eq('promotion_tier', 'gratis')
    .not('visible_until', 'is', null)
    .lt('visible_until', now);

  let stories = 0;
  for (const row of expiredStories || []) {
    const { error } = await supabaseAdmin
      .from('stories')
      .update({ status: 'archived' })
      .eq('id', row.id);
    if (!error) stories += 1;
  }

  return { ads, stories };
}
