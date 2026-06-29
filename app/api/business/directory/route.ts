import { NextResponse } from 'next/server';
import { listPublishedBusinessProfiles } from '@/lib/business';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profiles = await listPublishedBusinessProfiles({ limit: 100 });
    return NextResponse.json({
      profiles: profiles.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        logo_url: p.logo_url,
        banner_url: p.banner_url,
        theme_color: p.theme_color,
        is_verified: p.is_verified,
        contact_address: p.contact_address,
      })),
    });
  } catch (e) {
    console.error('[business/directory]', e);
    return NextResponse.json({ profiles: [] }, { status: 500 });
  }
}
