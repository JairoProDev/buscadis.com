import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { matchAdsForUser } from '@/lib/matching/server';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ adisoIds: [] });
  }

  const categoria = request.nextUrl.searchParams.get('categoria');
  const matches = await matchAdsForUser(user.id, 12, categoria);
  return NextResponse.json({ adisoIds: matches.map((m) => m.adisoId) });
}
