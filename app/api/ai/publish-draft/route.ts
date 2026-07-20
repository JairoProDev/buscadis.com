import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrUpdateDraft, getDraft, listDraftsBySession, markDraftPublished } from '@/lib/ai/publish-draft-store';
import { trackAIEvent } from '@/lib/ai/observability';
import { createAdisoInSupabase } from '@/lib/supabase';
import { Adiso, Categoria } from '@/types';
import { newAdisoId } from '@/lib/url';

const upsertSchema = z.object({
  sessionId: z.string().min(1),
  draftId: z.string().optional(),
  data: z.object({
    categoria: z.enum([
      'empleos',
      'inmuebles',
      'vehiculos',
      'servicios',
      'productos',
      'eventos',
      'negocios',
      'comunidad',
    ] as const),
    titulo: z.string().min(3).max(100),
    descripcion: z.string().min(5).max(2000),
    precio: z.number().optional(),
    ubicacion: z.string().optional(),
    contacto: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
});

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  const draftId = request.nextUrl.searchParams.get('draftId');
  if (draftId) {
    const draft = getDraft(draftId);
    if (!draft) return NextResponse.json({ error: 'Draft no encontrado' }, { status: 404 });
    return NextResponse.json({ draft });
  }
  if (!sessionId) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });
  return NextResponse.json({ drafts: listDraftsBySession(sessionId) });
}

export async function POST(request: NextRequest) {
  const parsed = upsertSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload invalido', details: parsed.error.issues }, { status: 400 });
  }

  const draft = createOrUpdateDraft(parsed.data);
  trackAIEvent({
    name: 'publish.draft.created',
    status: 'ok',
    sessionId: parsed.data.sessionId,
    tool: 'publish_assistant_tool',
    metadata: { draftId: draft.id },
  });

  return NextResponse.json({ draft });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const draftId = body?.draftId as string | undefined;
  if (!draftId) return NextResponse.json({ error: 'draftId requerido' }, { status: 400 });
  const draft = getDraft(draftId);
  if (!draft) return NextResponse.json({ error: 'Draft no encontrado' }, { status: 404 });

  const now = new Date();
  const adiso: Adiso = {
    id: newAdisoId(),
    categoria: draft.data.categoria as Categoria,
    titulo: draft.data.titulo,
    descripcion: draft.data.descripcion,
    contacto: draft.data.contacto || 'No especificado',
    ubicacion: draft.data.ubicacion || 'Cusco',
    fechaPublicacion: now.toISOString().split('T')[0],
    horaPublicacion: now.toTimeString().slice(0, 5),
    tamaño: 'miniatura',
    imagenUrl: draft.data.imageUrl,
    imagenesUrls: draft.data.imageUrl ? [draft.data.imageUrl] : undefined,
  };

  const created = await createAdisoInSupabase(adiso);
  markDraftPublished(draftId);

  const userId = created.user_id || created.usuario_id;
  if (userId) {
    const { createStoryFromAdiso } = await import('@/lib/stories/adiso-sync');
    void createStoryFromAdiso(userId, created);
  }

  trackAIEvent({
    name: 'chat.tool.executed',
    tool: 'publish_commit',
    status: 'ok',
    sessionId: draft.sessionId,
    metadata: { draftId, adisoId: created.id },
  });

  return NextResponse.json({ success: true, adiso: created });
}
