import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  REQUIRED_DOCS_FOR_SUBMIT,
  type MotoDocType,
} from '@/lib/envios';
import { CUSCO_ENVIOS_ZONES } from '@/lib/envios/zones';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  const { data: rider, error } = await supabaseAdmin
    .from('moto_riders')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rider) {
    return NextResponse.json({ rider: null, docs: [] });
  }

  const { data: docs } = await supabaseAdmin
    .from('moto_rider_docs')
    .select('*')
    .eq('rider_id', rider.id);

  return NextResponse.json({ rider, docs: docs || [] });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  let body: {
    display_name?: string;
    telefono_whatsapp?: string;
    placa?: string;
    zonas?: string[];
    foto_moto_url?: string;
    foto_perfil_url?: string;
    acepta_mandados_compra?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const zonas = (body.zonas || []).filter((z) =>
    (CUSCO_ENVIOS_ZONES as readonly string[]).includes(z)
  );

  const { data: existing } = await supabaseAdmin
    .from('moto_riders')
    .select('id, estado')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('moto_riders')
      .update({
        display_name: body.display_name?.trim() || null,
        telefono_whatsapp: body.telefono_whatsapp?.trim() || null,
        placa: body.placa?.trim()?.toUpperCase() || null,
        zonas,
        foto_moto_url: body.foto_moto_url || null,
        foto_perfil_url: body.foto_perfil_url || null,
        acepta_mandados_compra: body.acepta_mandados_compra ?? true,
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rider: data });
  }

  const { data, error } = await supabaseAdmin
    .from('moto_riders')
    .insert({
      user_id: user.id,
      estado: 'borrador',
      display_name: body.display_name?.trim() || null,
      telefono_whatsapp: body.telefono_whatsapp?.trim() || null,
      placa: body.placa?.trim()?.toUpperCase() || null,
      zonas,
      foto_moto_url: body.foto_moto_url || null,
      foto_perfil_url: body.foto_perfil_url || null,
      acepta_mandados_compra: body.acepta_mandados_compra ?? true,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rider: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  let body: {
    action?: string;
    online?: boolean;
    display_name?: string;
    telefono_whatsapp?: string;
    placa?: string;
    zonas?: string[];
    foto_moto_url?: string;
    acepta_mandados_compra?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { data: rider } = await supabaseAdmin
    .from('moto_riders')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!rider) {
    return NextResponse.json({ error: 'Regístrate primero' }, { status: 404 });
  }

  if (body.action === 'submit_for_review') {
    const { data: docs } = await supabaseAdmin
      .from('moto_rider_docs')
      .select('tipo')
      .eq('rider_id', rider.id);

    const tipos = new Set((docs || []).map((d) => d.tipo as MotoDocType));
    const missing = REQUIRED_DOCS_FOR_SUBMIT.filter((t) => !tipos.has(t));
    if (!rider.placa) missing.push('placa' as MotoDocType);
    if (!rider.telefono_whatsapp) {
      return NextResponse.json(
        { error: 'Falta teléfono WhatsApp', missing },
        { status: 400 }
      );
    }
    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'Faltan documentos', missing },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('moto_riders')
      .update({ estado: 'pendiente' })
      .eq('id', rider.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rider: data });
  }

  if (typeof body.online === 'boolean') {
    if (rider.estado !== 'aprobado') {
      return NextResponse.json(
        { error: 'Solo riders aprobados pueden ponerse online' },
        { status: 403 }
      );
    }
    const { data, error } = await supabaseAdmin
      .from('moto_riders')
      .update({
        online: body.online,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', rider.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ rider: data });
  }

  const patch: Record<string, unknown> = {};
  if (body.display_name !== undefined) patch.display_name = body.display_name?.trim();
  if (body.telefono_whatsapp !== undefined)
    patch.telefono_whatsapp = body.telefono_whatsapp?.trim();
  if (body.placa !== undefined) patch.placa = body.placa?.trim()?.toUpperCase();
  if (body.zonas !== undefined) {
    patch.zonas = body.zonas.filter((z) =>
      (CUSCO_ENVIOS_ZONES as readonly string[]).includes(z)
    );
  }
  if (body.foto_moto_url !== undefined) patch.foto_moto_url = body.foto_moto_url;
  if (body.acepta_mandados_compra !== undefined)
    patch.acepta_mandados_compra = body.acepta_mandados_compra;

  const { data, error } = await supabaseAdmin
    .from('moto_riders')
    .update(patch)
    .eq('id', rider.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ rider: data });
}
