import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProductAsAdiso } from '@/lib/business';

export const dynamic = 'force-dynamic';

/** Producto de catálogo público como adiso (página SEO del marketplace). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adiso = await getBusinessProductAsAdiso(id);

    if (!adiso || adiso.estaActivo === false) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ adiso });
  } catch (e) {
    console.error('[catalog/products/id]', e);
    return NextResponse.json({ error: 'Error al cargar producto' }, { status: 500 });
  }
}
