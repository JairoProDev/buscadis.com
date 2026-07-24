import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { notifyRiderKyc } from '@/lib/envios';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) return null;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.rol !== 'admin') return null;
  return user;
}

async function signDocUrl(pathOrUrl: string): Promise<string> {
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  const { data } = await supabaseAdmin.storage
    .from('moto-kyc')
    .createSignedUrl(pathOrUrl, 60 * 60);
  return data?.signedUrl || pathOrUrl;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const estado = request.nextUrl.searchParams.get('estado') || 'pendiente';

  const { data: riders, error } = await supabaseAdmin
    .from('moto_riders')
    .select('*')
    .eq('estado', estado)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const withDocs = await Promise.all(
    (riders || []).map(async (r) => {
      const { data: docs } = await supabaseAdmin
        .from('moto_rider_docs')
        .select('*')
        .eq('rider_id', r.id);

      const signedDocs = await Promise.all(
        (docs || []).map(async (d) => ({
          ...d,
          preview_url: await signDocUrl(d.url),
        }))
      );

      return { ...r, docs: signedDocs };
    })
  );

  return NextResponse.json({ riders: withDocs });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    rider_id?: string;
    action?: 'aprobar' | 'rechazar' | 'suspender';
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.rider_id || !body.action) {
    return NextResponse.json({ error: 'rider_id y action requeridos' }, { status: 400 });
  }

  const estadoMap = {
    aprobar: 'aprobado',
    rechazar: 'rechazado',
    suspender: 'suspendido',
  } as const;

  const { data, error } = await supabaseAdmin
    .from('moto_riders')
    .update({
      estado: estadoMap[body.action],
      admin_note: body.note || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      online: body.action === 'aprobar' ? false : false,
    })
    .eq('id', body.rider_id)
    .select('*')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
  }

  if (body.action === 'aprobar' || body.action === 'rechazar') {
    await notifyRiderKyc(data.user_id, body.action === 'aprobar', body.note);
  }

  return NextResponse.json({ rider: data });
}
