/**
 * Transfiere avisos de un batch (private_data.batch_id) a un nuevo user_id.
 *
 * Uso:
 *   npx tsx scripts/transfer-adisos-owner.ts --batch eco-terra-jobs-2026-06 --email cliente@ejemplo.com
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  let batch = '';
  let email = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--batch') batch = args[++i] || '';
    if (args[i] === '--email') email = args[++i] || '';
  }
  if (!batch || !email) {
    console.error('Uso: npx tsx scripts/transfer-adisos-owner.ts --batch BATCH_ID --email user@example.com');
    process.exit(1);
  }
  return { batch, email };
}

async function findUserIdByEmail(email: string): Promise<string> {
  const { supabaseAdmin } = await import('../lib/supabase-admin');
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Usuario no encontrado: ${email}`);
}

async function main() {
  const { batch, email } = parseArgs();
  const newOwnerId = await findUserIdByEmail(email);
  const { supabaseAdmin } = await import('../lib/supabase-admin');

  const { data: rows, error: fetchError } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, user_id, private_data')
    .contains('private_data', { batch_id: batch });

  if (fetchError) throw fetchError;
  if (!rows?.length) {
    console.log('No se encontraron avisos para batch:', batch);
    process.exit(0);
  }

  console.log(`Transfiriendo ${rows.length} avisos a ${email} (${newOwnerId})`);

  for (const row of rows) {
    const privateData = {
      ...(row.private_data as Record<string, unknown>),
      pending_owner_transfer: false,
      transferred_at: new Date().toISOString(),
      transferred_to: newOwnerId,
      previous_owner_id: row.user_id,
    };

    const { error } = await supabaseAdmin
      .from('adisos')
      .update({ user_id: newOwnerId, private_data: privateData })
      .eq('id', row.id);

    if (error) {
      console.error(`Error en ${row.id}:`, error.message);
    } else {
      console.log(`✓ ${row.titulo?.slice(0, 50)}…`);
    }
  }

  console.log('Transferencia completada.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
