import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Adiso } from '@/types';
import { getAdisosPageFromSupabase } from '@/lib/supabase';
import { getAdisoUrl } from '@/lib/url';
import { getSiteUrl } from '@/lib/seo/og-image';
import { getBusinessProfilePath } from '@/lib/seo/business-metadata';
import { MARKETPLACE_CATEGORIES } from '@/lib/seo/category-metadata';
import type { Categoria } from '@/types';
import { countCuscoHubAdisos, isCuscoHubIndexable } from '@/lib/seo/cusco-feed';
import { getCuscoHubPath } from '@/lib/seo/cusco-hubs';

export const ADISO_SITEMAP_PAGE_SIZE = 5000;

export function adisoLastModified(adiso: Adiso): Date {
  try {
    if (adiso.fechaPublicacion && adiso.horaPublicacion) {
      const dateString = `${adiso.fechaPublicacion}T${adiso.horaPublicacion}:00`;
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) return date;
    }
  } catch {
    // fall through
  }
  return new Date();
}

export function buildStaticSitemapEntries(siteUrl: string): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${siteUrl}/deals`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${siteUrl}/publicar`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${siteUrl}/guia`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/ayuda`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/privacidad`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/terminos`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];
}

export async function buildCuscoHubSitemapEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const categoria of MARKETPLACE_CATEGORIES) {
    try {
      const total = await countCuscoHubAdisos(categoria as Categoria);
      if (!isCuscoHubIndexable(total)) continue;
      entries.push({
        url: `${siteUrl}${getCuscoHubPath(categoria as Categoria)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.75,
      });
    } catch {
      // omit hub if count fails
    }
  }

  return entries;
}

export function buildCategorySitemapEntries(siteUrl: string): MetadataRoute.Sitemap {
  const now = new Date();
  return MARKETPLACE_CATEGORIES.map((categoria) => ({
    url: `${siteUrl}/categoria/${categoria}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));
}

export async function getPublishedBusinessProfiles(): Promise<
  { slug: string; updated_at?: string | null }[]
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await client
    .from('business_profiles')
    .select('slug, updated_at')
    .eq('is_published', true)
    .limit(5000);

  return data || [];
}

export function buildBusinessSitemapEntries(
  siteUrl: string,
  profiles: { slug: string; updated_at?: string | null }[]
): MetadataRoute.Sitemap {
  return profiles.map((profile) => ({
    url: `${siteUrl}${getBusinessProfilePath(profile.slug)}`,
    lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}

export async function countActiveAdisosForSitemap(): Promise<number> {
  const { total } = await getAdisosPageFromSupabase({
    limit: 1,
    offset: 0,
    soloActivos: true,
  });
  return total;
}

export async function buildAdisoSitemapChunk(
  siteUrl: string,
  chunkIndex: number
): Promise<MetadataRoute.Sitemap> {
  const offset = chunkIndex * ADISO_SITEMAP_PAGE_SIZE;
  const { items } = await getAdisosPageFromSupabase({
    limit: ADISO_SITEMAP_PAGE_SIZE,
    offset,
    soloActivos: true,
  });

  return items.map((adiso) => ({
    url: `${siteUrl}${getAdisoUrl(adiso)}`,
    lastModified: adisoLastModified(adiso),
    changeFrequency: 'weekly' as const,
    priority: adiso.categoria === 'empleos' ? 0.65 : 0.6,
  }));
}

export async function generateSitemapIds(): Promise<{ id: number }[]> {
  const ids: { id: number }[] = [{ id: 0 }];
  try {
    const total = await countActiveAdisosForSitemap();
    const chunks = Math.ceil(total / ADISO_SITEMAP_PAGE_SIZE);
    for (let i = 0; i < chunks; i++) {
      ids.push({ id: i + 1 });
    }
  } catch (error) {
    console.error('[sitemap] count adisos failed:', error);
  }
  return ids;
}

export async function buildSitemapById(id: number): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  if (id === 0) {
    let businessPages: MetadataRoute.Sitemap = [];
    try {
      const profiles = await getPublishedBusinessProfiles();
      businessPages = buildBusinessSitemapEntries(siteUrl, profiles);
    } catch (error) {
      console.error('[sitemap] negocios:', error);
    }

    const cuscoHubPages = await buildCuscoHubSitemapEntries(siteUrl);

    return [
      ...buildStaticSitemapEntries(siteUrl),
      ...buildCategorySitemapEntries(siteUrl),
      ...cuscoHubPages,
      ...businessPages,
    ];
  }

  const chunkIndex = id - 1;
  try {
    return await buildAdisoSitemapChunk(siteUrl, chunkIndex);
  } catch (error) {
    console.error(`[sitemap] adisos chunk ${chunkIndex}:`, error);
    return [];
  }
}
