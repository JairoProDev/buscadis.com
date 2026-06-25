import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

const bodySchema = z.object({
  status: z.enum(['pending', 'in_review', 'completed', 'rejected']),
  adminNotes: z.string().trim().max(3000).optional().default(''),
});

function authorize(request: NextRequest): boolean {
  const secret = process.env.ADMIN_API_KEY;
  if (!secret) return true;
  return request.headers.get('x-admin-api-key') === secret;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = bodySchema.safeParse((await request.json()) as unknown);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { status, adminNotes } = parsed.data;

    const patch: Record<string, unknown> = {
      status,
      admin_notes: adminNotes || null,
    };
    if (status === 'completed' || status === 'rejected') {
      patch.processed_at = new Date().toISOString();
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('account_deletion_requests')
      .update(patch)
      .eq('id', id);

    if (error) {
      console.error('[admin/account-deletion-requests/:id] update error:', error.message);
      return NextResponse.json({ error: 'Could not update request' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }
    console.error('[admin/account-deletion-requests/:id] unexpected error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
