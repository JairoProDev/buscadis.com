import { NextRequest, NextResponse } from 'next/server';
import { getDealClipByIdServer } from '@/lib/deals/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const clip = await getDealClipByIdServer(id);
    if (!clip) {
      return NextResponse.json({ error: 'Deal no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ clip });
  } catch (e) {
    console.error('[api/deals/[id] GET]', e);
    return NextResponse.json({ error: 'Error al cargar deal' }, { status: 500 });
  }
}
