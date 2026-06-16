import { NextRequest, NextResponse } from 'next/server';
import { getDealClipsByBusinessSlugServer } from '@/lib/deals/server';

/** businessId is the public business slug for this route */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;
  const clips = await getDealClipsByBusinessSlugServer(decodeURIComponent(businessId));
  return NextResponse.json({ clips });
}
