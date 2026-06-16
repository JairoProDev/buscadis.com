import { NextRequest, NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/lib/search/suggest';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '8', 10) || 8, 12);

  if (q.length < 2) {
    return NextResponse.json({ adisos: [], queries: [], completion: null, hits: [] });
  }

  try {
    const result = await getSearchSuggestions(q, limit);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=5' },
    });
  } catch (err) {
    console.error('[GET /api/search/suggest]', err);
    return NextResponse.json({ adisos: [], queries: [], completion: null, hits: [] });
  }
}
