/**
 * Asegura que "casa carbajal" encuentre el anuncio destacado (título + descripción).
 * Run: node --env-file=.env.local scripts/patch-casa-carbajal-search.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase admin env');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = 'casacarbajalrest@gmail.com';
const TITULO = 'Casa Carbajal — Restaurante busca personal en el Centro Histórico';
const DESCRIPCION_PREFIX = 'Casa Carbajal (Centro Histórico de Cusco).';

async function main() {
  const targetIds = new Set(['yyNepGVyWs']);

  const { data: profile } = await admin.from('profiles').select('id').eq('email', EMAIL).maybeSingle();
  if (profile?.id) {
    const { data: rows } = await admin.from('adisos').select('id').eq('user_id', profile.id);
    for (const row of rows ?? []) {
      if (row?.id) targetIds.add(row.id);
    }
  }

  for (const id of targetIds) {
    const { data: row } = await admin
      .from('adisos')
      .select('id,titulo,descripcion,atributos')
      .eq('id', id)
      .maybeSingle();
    if (!row) {
      console.log('skip missing', id);
      continue;
    }

    let descripcion = row.descripcion || '';
    if (!descripcion.toLowerCase().includes('casa carbajal')) {
      descripcion = `${DESCRIPCION_PREFIX}\n${descripcion}`.trim();
    }

    const atributos = { ...(row.atributos ?? {}), negocio: 'Casa Carbajal' };

    const { error } = await admin
      .from('adisos')
      .update({ titulo: TITULO, descripcion, atributos })
      .eq('id', id);

    if (error) console.error(id, error.message);
    else console.log('updated', id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
