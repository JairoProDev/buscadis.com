/**
 * Historias Mapacho: una por puesto (plantilla del feed), sin historia genérica del flyer.
 *
 *   npx tsx scripts/clientes/sync-mapacho-stories.ts
 *   npx tsx scripts/clientes/sync-mapacho-stories.ts --apply
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'cliente-restaurante-mapacho-2026-10';
const PRINCIPAL_SLUG = 'principal-8-vacantes';
const ROLE_SLUGS = [
  'maestro-panadero-pastelero',
  'ayudante-pasteleria',
  'ayudante-cocina',
  'vajillero',
  'moza-ingles',
] as const;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');
const apply = process.argv.includes('--apply');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function storyMediaUrl(adisoId: string): string {
  return `${SITE}/og/adiso/${adisoId}`;
}

async function main() {
  const { supabaseAdmin } = await import('../../lib/supabase-admin');

  const { data: adisos, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, user_id, private_data, promotion_tier, promotion_expires_at')
    .contains('private_data', { batch_id: BATCH_ID });

  if (error) throw error;
  if (!adisos?.length) {
    console.log('No Mapacho batch');
    return;
  }

  const userId = adisos[0].user_id as string;
  const bySlug = new Map<string, (typeof adisos)[0]>();
  for (const row of adisos) {
    const slug = String((row.private_data as Record<string, unknown>)?.job_slug || '');
    if (slug) bySlug.set(slug, row);
  }

  const { data: activeStories } = await supabaseAdmin
    .from('stories')
    .select('id, adiso_id, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  const principal = bySlug.get(PRINCIPAL_SLUG);
  const toArchive = (activeStories || []).filter((s) => {
    if (principal && s.adiso_id === principal.id) return true;
    const ad = adisos.find((a) => a.id === s.adiso_id);
    const slug = String((ad?.private_data as Record<string, unknown>)?.job_slug || '');
    return !ROLE_SLUGS.includes(slug as (typeof ROLE_SLUGS)[number]);
  });

  const plan: {
    slug: string;
    adisoId: string;
    mediaUrl: string;
    action: 'create' | 'update';
  }[] = [];

  for (const slug of ROLE_SLUGS) {
    const row = bySlug.get(slug);
    if (!row) {
      console.warn('Missing ad for slug', slug);
      continue;
    }
    const mediaUrl = storyMediaUrl(row.id);
    const existing = (activeStories || []).find((s) => s.adiso_id === row.id);
    plan.push({
      slug,
      adisoId: row.id,
      mediaUrl,
      action: existing ? 'update' : 'create',
    });
  }

  console.log(JSON.stringify({ archive: toArchive.map((s) => s.id), plan }, null, 2));

  if (!apply) return;

  const now = new Date().toISOString();
  for (const s of toArchive) {
    await supabaseAdmin
      .from('stories')
      .update({ status: 'archived', archived_at: now })
      .eq('id', s.id);
  }

  for (const item of plan) {
    const row = bySlug.get(item.slug)!;
    const expires =
      (row.promotion_expires_at as string) || '2026-10-31T23:59:59.000Z';
    const publicPath = `/a/${row.id}/${slugify(String(row.titulo))}`;
    const payload = {
      user_id: userId,
      media_url: item.mediaUrl,
      media_type: 'image' as const,
      caption: row.titulo,
      categoria: 'empleos',
      adiso_id: row.id,
      promotion_tier: row.promotion_tier || 'premium',
      objective: 'contactos',
      source: 'adiso_auto',
      cta_url: `${SITE}${publicPath}`,
      status: 'active',
      visible_until: expires,
      expires_at: expires,
    };

    if (item.action === 'update') {
      const existing = (activeStories || []).find((s) => s.adiso_id === row.id);
      await supabaseAdmin.from('stories').update(payload).eq('id', existing!.id);
    } else {
      await supabaseAdmin.from('stories').insert(payload);
    }
  }

  console.log('Done:', plan.length, 'role stories active');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
