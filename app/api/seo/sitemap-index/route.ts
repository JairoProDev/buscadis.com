import { NextResponse } from 'next/server';
import { buildSitemapIndexXml } from '@/lib/seo/sitemap-index';

export const revalidate = 3600;

export async function GET() {
  const xml = await buildSitemapIndexXml();
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
