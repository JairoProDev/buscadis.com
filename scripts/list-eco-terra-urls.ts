import * as dotenv from 'dotenv';
import * as path from 'path';
import { getAdisoUrl } from '../lib/url';
import type { Adiso } from '../types';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  const { data } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, categoria, distrito, provincia, departamento, private_data')
    .contains('private_data', { batch_id: 'eco-terra-jobs-2026-06' });

  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');

  for (const row of data || []) {
    const pd = row.private_data as { job_slug?: string; is_aggregator?: boolean };
    const adiso = {
      id: row.id,
      titulo: row.titulo,
      categoria: row.categoria,
      ubicacion: {
        distrito: row.distrito,
        provincia: row.provincia,
        departamento: row.departamento,
      },
    } as Adiso;
    const slug = pd.is_aggregator ? 'CAPTADOR' : pd.job_slug;
    console.log(`${slug}: ${site}${getAdisoUrl(adiso)}`);
  }
}

main();
