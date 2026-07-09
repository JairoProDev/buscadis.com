import { createClient } from '@supabase/supabase-js';
import type { BusinessProfile } from '@/types/business';
import { normalizeBusinessProfile } from '@/lib/business/normalize-profile';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Perfil público por slug — solo si is_published (service role, sin cookies). */
export async function getPublishedBusinessProfileBySlug(
  rawSlug: string
): Promise<BusinessProfile | null> {
  const slug = normalizeBusinessSlug(rawSlug);
  if (!slug) return null;

  const client = getAdminClient();
  if (!client) return null;

  const { data, error } = await client
    .from('business_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeBusinessProfile(data as BusinessProfile) as BusinessProfile;
}
