import { NextRequest, NextResponse } from 'next/server';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import { requireApiKey } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar API Key
  const authError = await requireApiKey(request);
  if (authError) {
    return authError;
  }
  
  try {
    const adiso = await getAdisoByIdFromSupabase(params.id);
    
    if (!adiso) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: adiso });
  } catch (error: any) {
    console.error('Error en API v1/adisos/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener anuncio' },
      { status: 500 }
    );
  }
}











