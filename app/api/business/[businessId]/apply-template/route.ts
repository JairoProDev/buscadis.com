import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { applyTemplate } from '@/lib/business/templates/apply-template';
import { sanitizeBusinessProfilePayload } from '@/lib/business';
import { revalidateTag } from 'next/cache';
import { BUSINESS_CACHE_TAG } from '@/lib/business/seo';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const bodySchema = z.object({
  templateId: z.string(),
  policy: z.enum(['merge', 'replace']).optional(),
  themePreset: z.enum(['executive', 'minimal', 'organic', 'cyberpunk']).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { businessId } = await params;
    const body = bodySchema.parse(await req.json());
    const { data: business, error: fetchErr } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('id', businessId)
      .single();

    if (fetchErr || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    if (business.user_id !== user.id) {
      const { data: member } = await supabaseAdmin
        .from('business_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_profile_id', businessId)
        .eq('status', 'active')
        .maybeSingle();
      if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
        return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
      }
    }

    const patch = applyTemplate(business, {
      templateId: body.templateId,
      policy: body.policy,
      themePreset: body.themePreset,
    });

    const sanitized = sanitizeBusinessProfilePayload(patch);
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('business_profiles')
      .update({ ...sanitized, updated_at: new Date().toISOString() })
      .eq('id', businessId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    if (updated?.slug) revalidateTag(BUSINESS_CACHE_TAG(updated.slug));
    return NextResponse.json({ profile: updated });
  } catch (e) {
    console.error('[apply-template]', e);
    return NextResponse.json({ error: 'Error al aplicar plantilla' }, { status: 500 });
  }
}
