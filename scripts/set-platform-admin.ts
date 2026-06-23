/**
 * Grants platform superadmin to buscadiss@gmail.com (or email from argv).
 *
 *   npx tsx scripts/set-platform-admin.ts
 *   npx tsx scripts/set-platform-admin.ts otro@ejemplo.com
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const email = (process.argv[2] || 'buscadiss@gmail.com').trim().toLowerCase();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  const user = list.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    throw new Error(`No hay usuario registrado con ${email}. Debe iniciar sesión al menos una vez.`);
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: user.id,
      email,
      rol: 'admin',
      is_platform_admin: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    if (profileError.message?.includes('is_platform_admin')) {
      const { error: fallbackError } = await admin
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email,
            rol: 'admin',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      if (fallbackError) throw fallbackError;
      console.warn('Columna is_platform_admin aún no existe — aplicá migración 025 y volvé a correr.');
    } else {
      throw profileError;
    }
  }

  console.log(`✓ ${email} es superadmin de plataforma (user id: ${user.id})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
