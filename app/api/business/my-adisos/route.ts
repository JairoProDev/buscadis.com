/**
 * GET /api/business/my-adisos
 * Lista avisos activos del usuario para la puerta de entrada del creador.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dbToAdiso } from '@/lib/supabase';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('adisos')
      .select('*')
      .eq('user_id', user.id)
      .eq('esta_activo', true)
      .is('deleted_at', null)
      .order('fecha_publicacion', { ascending: false })
      .limit(12);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adisos = (data || []).map((row) => {
      const a = dbToAdiso(row);
      return {
        id: a.id,
        titulo: a.titulo,
        categoria: a.categoria,
        contacto: a.contacto,
        imagenUrl: a.imagenUrl || a.imagenesUrls?.[0] || null,
        ubicacion:
          typeof a.ubicacion === 'string'
            ? a.ubicacion
            : [a.ubicacion?.distrito, a.ubicacion?.provincia].filter(Boolean).join(', '),
      };
    });

    return NextResponse.json({ success: true, adisos });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
