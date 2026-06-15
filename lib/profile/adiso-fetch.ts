import { supabaseAdmin } from '@/lib/supabase-admin';
import { dbToAdiso } from '@/lib/supabase';
import { Adiso } from '@/types';

export async function getAdisoByIdFromDb(adisoId: string): Promise<Adiso | null> {
  const { data, error } = await supabaseAdmin
    .from('adisos')
    .select('*')
    .eq('id', adisoId)
    .maybeSingle();

  if (error || !data) return null;
  return dbToAdiso(data);
}
