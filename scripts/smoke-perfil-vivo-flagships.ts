/**
 * Smoke: payloads Perfil Vivo para flagships reales.
 * npx tsx scripts/smoke-perfil-vivo-flagships.ts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import {
  buildPerfilPayloadFromSources,
  sanitizePerfilPayload,
} from '../packages/perfil-vivo/src/server';
import { resolverModulos } from '../packages/perfil-vivo/src/modulos/resolver';
import { isPerfilVivoEnabled } from '../lib/business/perfil-vivo-flag';

config({ path: '.env.local' });

const SLUGS = ['quival', 'villachaco', 'agrilsur', 'cristalimag', 'buscadis'];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');
  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const slug of SLUGS) {
    const { data: profile, error } = await sb
      .from('business_profiles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !profile) {
      console.log(slug, 'MISSING', error?.message);
      continue;
    }
    const { data: catalog } = await sb
      .from('catalog_products')
      .select('*')
      .eq('business_profile_id', profile.id)
      .eq('status', 'published')
      .limit(40);
    const { data: reviews } = await sb
      .from('business_reviews')
      .select('*')
      .eq('business_profile_id', profile.id)
      .limit(20);

    const payload = buildPerfilPayloadFromSources({
      profileRow: profile,
      catalogRows: catalog || [],
      reviewRows: reviews || [],
    });
    if (!payload) {
      console.log(slug, 'PAYLOAD_NULL');
      continue;
    }
    const s = sanitizePerfilPayload(payload);
    const mods = resolverModulos(s.negocio).map((m) => m.tipo);
    console.log(
      JSON.stringify({
        slug,
        pv: isPerfilVivoEnabled(profile),
        arq: s.negocio.arquetipo,
        cat: s.negocio.categoria.nombre,
        dist: s.negocio.ubicacion?.distrito,
        wa: s.negocio.contacto.whatsapp,
        productos: s.productos.length,
        totalCat: (catalog || []).length,
        resenas: s.resenas.length,
        horario: Boolean(s.negocio.horario),
        mods: mods.join(','),
      })
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
