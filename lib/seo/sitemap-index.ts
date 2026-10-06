import { generateSitemapIds } from '@/lib/seo/sitemap-data';
import { getSiteUrl } from '@/lib/seo/og-image';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Índice sitemap.org que lista todos los chunks `/sitemap/{id}.xml`. */
export async function buildSitemapIndexXml(): Promise<string> {
  const siteUrl = getSiteUrl().replace(/\/$/, '');
  let ids: { id: number }[] = [{ id: 0 }];
  try {
    ids = await generateSitemapIds();
  } catch (error) {
    console.error('[sitemap-index] generateSitemapIds failed:', error);
  }

  const entries = ids
    .map(
      ({ id }) =>
        `  <sitemap>\n    <loc>${escapeXml(`${siteUrl}/sitemap/${id}.xml`)}</loc>\n  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}
