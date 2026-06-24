/**
 * Backfill cached QR PNGs for published businesses with logos.
 * Run: npx tsx scripts/backfill-qr-visual.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { eagerGenerateQrPng } from '../lib/qr/service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: profiles, error } = await supabase
    .from('business_profiles')
    .select('id, slug, theme_color, logo_url, subscription_tier')
    .eq('is_published', true)
    .not('logo_url', 'is', null);

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  const rows = profiles || [];
  console.log(`Regenerating QR for ${rows.length} published businesses with logo…`);

  let ok = 0;
  let fail = 0;

  for (const p of rows) {
    try {
      await eagerGenerateQrPng({
        businessProfileId: p.id,
        slug: p.slug,
        themeColor: p.theme_color,
        logoUrl: p.logo_url,
        styleTier: p.subscription_tier === 'pro' ? 'pro' : 'free',
      });
      ok++;
      console.log(`  ✓ ${p.slug}`);
    } catch (err) {
      fail++;
      console.warn(`  ✗ ${p.slug}:`, err);
    }
  }

  console.log(`Done. ${ok} ok, ${fail} failed.`);

  const villa = rows.find((r) => r.slug === 'villachaco');
  if (villa) {
    await supabase
      .from('qr_codes')
      .update({
        render_mode: 'visual',
        style_config: {
          renderMode: 'visual',
          presetId: 'visual-fusion',
          halftoneIntensity: 0.75,
          dotScale: 0.35,
          buscadisFinderMark: true,
        },
        qa_status: 'pending',
      })
      .eq('business_profile_id', villa.id);
    await eagerGenerateQrPng({
      businessProfileId: villa.id,
      slug: villa.slug,
      themeColor: villa.theme_color,
      logoUrl: villa.logo_url,
      styleTier: 'pro',
    });
    console.log('Villa Chaco set to visual mode.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
