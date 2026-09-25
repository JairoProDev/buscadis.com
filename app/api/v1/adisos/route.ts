import { NextRequest, NextResponse } from 'next/server';
import { getAdisosPageFromSupabase } from '@/lib/supabase';
import { requireApiKey } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verificar API Key
  const authError = await requireApiKey(request);
  if (authError) {
    return authError;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const categoria = searchParams.get('categoria');
    const activos = searchParams.get('activos') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const buscar = searchParams.get('buscar') || '';

    // Validar límite
    if (limit > 1000) {
      return NextResponse.json(
        { error: 'El límite máximo es 1000' },
        { status: 400 }
      );
    }

    const { items, total } = await getAdisosPageFromSupabase({
      limit,
      offset,
      soloActivos: activos,
      categoria: categoria || undefined,
      busqueda: buscar || undefined,
    });

    return NextResponse.json({
      data: items,
      paginacion: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    });
  } catch (error: any) {
    console.error('Error en API v1/adisos:', error);
    return NextResponse.json(
      { error: 'Error al obtener adisos' },
      { status: 500 }
    );
  }
}











