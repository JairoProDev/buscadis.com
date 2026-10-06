import type { Categoria } from '@/types';
import { getAdisosPageFromSupabase } from '@/lib/supabase';
import { CUSCO_HUB_MIN_ADISOS_INDEX, CUSCO_HUB_REGION_SLUG } from '@/lib/seo/cusco-hubs';

const CUSCO_REGION_PATTERN = CUSCO_HUB_REGION_SLUG;

export async function getCuscoHubAdisosPage(options: {
  categoria: Categoria;
  limit: number;
  offset: number;
}): Promise<{ items: Awaited<ReturnType<typeof getAdisosPageFromSupabase>>['items']; total: number }> {
  const { items, total } = await getAdisosPageFromSupabase({
    limit: options.limit,
    offset: options.offset,
    soloActivos: true,
    categoria: options.categoria,
    regionIlike: CUSCO_REGION_PATTERN,
  });
  return { items, total };
}

export async function countCuscoHubAdisos(categoria: Categoria): Promise<number> {
  const { total } = await getAdisosPageFromSupabase({
    limit: 1,
    offset: 0,
    soloActivos: true,
    categoria,
    regionIlike: CUSCO_REGION_PATTERN,
  });
  return total;
}

export function isCuscoHubIndexable(count: number): boolean {
  return count >= CUSCO_HUB_MIN_ADISOS_INDEX;
}
