import { NextRequest, NextResponse } from 'next/server';
import { getDealClipsByBusinessSlugServer } from '@/lib/deals/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const clips = await getDealClipsByBusinessSlugServer(decoded);
  return NextResponse.json({ clips });
}
