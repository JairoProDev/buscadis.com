import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data } = await supabaseAdmin.from('business_profiles').select('*').eq('slug', 'agrilsur').single();
  console.log(data);
}
run();
