import { NextRequest, NextResponse } from 'next/server';
import { suggestDealCopy } from '@/lib/deals/ai-suggest';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const suggestions = suggestDealCopy(body);
    return NextResponse.json({ suggestions });
  } catch (e) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
