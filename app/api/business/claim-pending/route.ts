import { NextResponse } from 'next/server';
import { claimPendingBusinessOwnership } from '@/lib/business/claim-pending-ownership';

export async function POST() {
  const result = await claimPendingBusinessOwnership();

  if (!result.ok && result.error === 'not_authenticated') {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  return NextResponse.json(result);
}
