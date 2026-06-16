#!/usr/bin/env node
/**
 * Seed deal_clips from top adisos (image as Ken Burns clip until video adoption).
 * Usage: node scripts/seed-deal-clips.mjs [--limit=50]
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 50;

function parseImages(raw) {
  if (!raw) return [];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
}

async function main() {
  const { data: adisos, error } = await supabase
    .from('adisos')
    .select('id, titulo, descripcion, categoria, imagenes_urls, imagen_url, user_id, precio, moneda')
    .or('esta_activo.is.null,esta_activo.eq.true')
    .order('fecha_publicacion', { ascending: false })
    .limit(LIMIT);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let created = 0;
  for (const row of adisos || []) {
    const imgs = parseImages(row.imagenes_urls);
    const mediaUrl = imgs[0] || row.imagen_url;
    if (!mediaUrl || !row.user_id) continue;

    const { data: existing } = await supabase
      .from('deal_clips')
      .select('id')
      .eq('adiso_id', row.id)
      .maybeSingle();

    if (existing) continue;

    const visibleUntil = new Date(Date.now() + 30 * 24 * 3600000).toISOString();

    const { error: insErr } = await supabase.from('deal_clips').insert({
      author_user_id: row.user_id,
      adiso_id: row.id,
      media_url: mediaUrl,
      media_type: 'image',
      poster_url: mediaUrl,
      title: row.titulo?.slice(0, 120) || 'Oferta',
      caption: row.descripcion?.slice(0, 300) || null,
      categoria: row.categoria,
      price_display: row.precio ?? null,
      currency: row.moneda || 'PEN',
      cta_type: 'adiso',
      status: 'active',
      promotion_tier: 'gratis',
      visible_until: visibleUntil,
      source: 'seed',
    });

    if (!insErr) created++;
    else console.warn('Skip', row.id, insErr.message);
  }

  // Seed default challenge
  await supabase.from('deal_challenges').upsert(
    {
      slug: 'deal-verano',
      title: 'Deal Verano',
      description: 'Sube tu promo de verano con #DealVerano',
      hashtag: 'DealVerano',
      is_active: true,
    },
    { onConflict: 'slug' }
  );

  console.log(`[seed-deal-clips] Created ${created} clips from adisos`);
}

main();
