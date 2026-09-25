import { NextRequest, NextResponse } from 'next/server';
import { parseMapQuery, queryMapListings } from '@/lib/map/query';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const parsed = parseMapQuery(request.nextUrl.searchParams);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const listings = await queryMapListings(parsed);
    return NextResponse.json(
      { listings, total: listings.length },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
        },
      },
    );
  } catch (error) {
    console.error('[map/listings]', error);
    return NextResponse.json({ error: 'No se pudieron cargar los anuncios del mapa.' }, { status: 500 });
  }
}
