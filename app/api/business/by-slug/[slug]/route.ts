import { NextRequest, NextResponse } from 'next/server';
import { getPublishedBusinessProfileBySlug } from '@/lib/business/get-public-profile';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const profile = await getPublishedBusinessProfileBySlug(slug);

  if (!profile) {
    return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
  }

  return NextResponse.json(
    { success: true, profile },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  );
}
