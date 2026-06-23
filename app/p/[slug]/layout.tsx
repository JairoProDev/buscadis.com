import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  buildBusinessNotFoundMetadata,
  buildBusinessShareMetadata,
} from '@/lib/seo/business-metadata';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }> | { slug: string };
}

async function fetchProfileForShare(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await client
    .from('business_profiles')
    .select(
      'slug, name, tagline, description, meta_title, meta_description, og_image_url, banner_url, logo_url, is_published'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!data || data.is_published === false) return null;
  return data;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const slug = decodeURIComponent(resolved.slug);
  const profile = await fetchProfileForShare(slug);
  if (!profile) return buildBusinessNotFoundMetadata();
  return buildBusinessShareMetadata(profile);
}

export default function BusinessProfileOgLayout({ children }: { children: ReactNode }) {
  return children;
}
