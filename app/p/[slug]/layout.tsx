import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import { getPublishedBusinessProfileBySlug } from '@/lib/business/get-public-profile';
import {
  buildBusinessNotFoundMetadata,
  buildBusinessShareMetadata,
} from '@/lib/seo/business-metadata';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const resolved = await params;
  const slug = normalizeBusinessSlug(resolved.slug);
  const profile = await getPublishedBusinessProfileBySlug(slug);
  if (!profile) return buildBusinessNotFoundMetadata();
  return buildBusinessShareMetadata(profile);
}

export default function BusinessProfileOgLayout({ children }: { children: ReactNode }) {
  return children;
}
