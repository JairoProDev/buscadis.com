import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { editToken?: string; cubierta?: boolean } | null;
  if (!body?.editToken) {
    return NextResponse.json({ error: 'Falta la clave del aviso.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('adisos')
    .select('private_data, atributos')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Aviso no encontrado.' }, { status: 404 });
  }

  const token = (data.private_data as { editToken?: string } | null)?.editToken;
  if (!token || token !== body.editToken) {
    return NextResponse.json({ error: 'Esa clave no corresponde a este aviso.' }, { status: 403 });
  }

  const cubierta = body.cubierta !== false;
  const atributos = (data.atributos as Record<string, unknown>) || {};
  const empleo = (atributos.empleo as Record<string, unknown>) || {};

  const { error: updateError } = await supabaseAdmin
    .from('adisos')
    .update({
      esta_activo: !cubierta,
      atributos: { ...atributos, empleo: { ...empleo, cubierta } },
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: 'No se pudo actualizar.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cubierta });
}
