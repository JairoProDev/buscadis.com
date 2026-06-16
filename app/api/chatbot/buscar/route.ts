import { NextRequest, NextResponse } from 'next/server';

/** @deprecated Use POST /api/search instead */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const consulta = body.consulta ?? body.terminos?.[0];
    if (!consulta) {
      return NextResponse.json({ error: 'Se requiere consulta' }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: String(consulta), maxResults: body.limite ?? 10 }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? 'Error al buscar' }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      deprecated: true,
      resultados: (data.adisos ?? []).map((adiso: { id: string; titulo: string; categoria: string; descripcion?: string; ubicacion?: unknown; fechaPublicacion?: string; estaActivo?: boolean }) => ({
        id: adiso.id,
        titulo: adiso.titulo,
        categoria: adiso.categoria,
        descripcion: adiso.descripcion?.substring(0, 200),
        ubicacion: adiso.ubicacion,
        fechaPublicacion: adiso.fechaPublicacion,
        estaActivo: adiso.estaActivo,
      })),
      total: data.count ?? 0,
    });
  } catch (error) {
    console.error('Error en chatbot/buscar (deprecated):', error);
    return NextResponse.json({ error: 'Error al buscar anuncios' }, { status: 500 });
  }
}
