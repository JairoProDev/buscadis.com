import type { MetadataRoute } from 'next';
import { buildSitemapById, generateSitemapIds } from '@/lib/seo/sitemap-data';

export async function generateSitemaps() {
  return generateSitemapIds();
}

export default async function sitemap(props: {
  id: Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  return buildSitemapById(id);
}
