/**
 * Historias Mapacho: flyer principal + 5 puestos (plantilla feed / OG).
 *
 *   npx tsx scripts/clientes/sync-mapacho-stories.ts
 *   npx tsx scripts/clientes/sync-mapacho-stories.ts --apply
 *   npx tsx scripts/clientes/sync-mapacho-stories.ts --apply --prewarm
 */
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const BATCH_ID = 'cliente-restaurante-mapacho-2026-10';
const PRINCIPAL_SLUG = 'principal-8-vacantes';
const STORY_ORDER = [
  PRINCIPAL_SLUG,
  'maestro-panadero-pastelero',
  'ayudante-pasteleria',
  'ayudante-cocina',
  'vajillero',
  'moza-ingles',
] as const;

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');
const apply = process.argv.includes('--apply');
const prewarm = process.argv.includes('--prewarm');

/** Plantillas feed por puesto (debe coincidir con publish-restaurante-mapacho.ts). */
const ROLE_FLYER_TEMPLATES: Record<string, string> = {
  'maestro-panadero-pastelero': 'editorial',
  'ayudante-pasteleria': 'ribbon',
  'ayudante-cocina': 'negocio',
  vajillero: 'minimal-cream',
  'moza-ingles': 'corner-mark',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function ogUrl(adisoId: string): string {
  return `${SITE}/og/adiso/${adisoId}`;
}

async function main() {
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  const { prewarmStoryCoverForAdiso } = await import('../../lib/stories/prewarm-cover');

  const { data: adisos, error } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, imagen_url, user_id, private_data, promotion_tier, promotion_expires_at')
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

  const allowedAdisoIds = new Set(
    STORY_ORDER.map((slug) => bySlug.get(slug)?.id).filter(Boolean) as string[],
  );

  const toArchive = (activeStories || []).filter((s) => !allowedAdisoIds.has(s.adiso_id || ''));

  for (const slug of STORY_ORDER) {
    if (slug === PRINCIPAL_SLUG) continue;
    const templateId = ROLE_FLYER_TEMPLATES[slug];
    const row = bySlug.get(slug);
    if (!row || !templateId) continue;
    const priv =
      row.private_data && typeof row.private_data === 'object'
        ? { ...(row.private_data as Record<string, unknown>) }
        : {};
    if (priv.flyerTemplateId === templateId) continue;
    priv.flyerTemplateId = templateId;
    if (apply) {
      await supabaseAdmin.from('adisos').update({ private_data: priv }).eq('id', row.id);
    } else {
      console.log('[dry-run] set flyerTemplateId', slug, templateId);
    }
    row.private_data = priv;
  }

  const plan: {
    slug: string;
    sortOrder: number;
    adisoId: string;
    mediaUrl: string;
    action: 'create' | 'update';
  }[] = [];

  for (let i = 0; i < STORY_ORDER.length; i++) {
    const slug = STORY_ORDER[i];
    const row = bySlug.get(slug);
    if (!row) {
      console.warn('Missing ad for slug', slug);
      continue;
    }

    let mediaUrl =
      slug === PRINCIPAL_SLUG && row.imagen_url
        ? String(row.imagen_url)
        : ogUrl(row.id);

    if (prewarm && slug !== PRINCIPAL_SLUG && apply) {
      const warmed = await prewarmStoryCoverForAdiso(row.id, userId);
      if (warmed) mediaUrl = warmed;
    } else if (apply && slug !== PRINCIPAL_SLUG) {
      const priv = row.private_data as Record<string, unknown>;
      const cached = priv?.story_cover_url;
      if (typeof cached === 'string' && cached.trim()) mediaUrl = cached.trim();
    }

    const existing = (activeStories || []).find((s) => s.adiso_id === row.id);
    plan.push({
      slug,
      sortOrder: i,
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
      sort_order: item.sortOrder,
    };

    if (item.action === 'update') {
      const existing = (activeStories || []).find((s) => s.adiso_id === row.id);
      await supabaseAdmin.from('stories').update(payload).eq('id', existing!.id);
    } else {
      await supabaseAdmin.from('stories').insert(payload);
    }
  }

  console.log('Done:', plan.length, 'stories active (flyer + roles)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
