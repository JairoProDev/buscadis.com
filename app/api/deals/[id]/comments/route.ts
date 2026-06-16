import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getDealCommentsServer, addDealCommentServer } from '@/lib/deals/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const comments = await getDealCommentsServer(id);
    return NextResponse.json({ comments });
  } catch (e) {
    console.error('[api/deals/comments GET]', e);
    return NextResponse.json({ error: 'Error al cargar comentarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const text = String(body.body || '').trim();
    if (!text) {
      return NextResponse.json({ error: 'Escribe un comentario' }, { status: 400 });
    }

    const comment = await addDealCommentServer(user.id, id, text, body.parentId);
    return NextResponse.json({ success: true, comment });
  } catch (e) {
    console.error('[api/deals/comments POST]', e);
    return NextResponse.json({ error: 'Error al comentar' }, { status: 500 });
  }
}
