import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { resolveBusinessForUser } from '@/lib/business-server-auth';
import { createServerClient } from '@/lib/supabase-server';
import { isPlatformAdminUser } from '@/lib/platform-admin';
import { getProfile } from '@/lib/user';
import { sendBusinessOwnerAssignEmail } from '@/lib/email-business-owner-assign';
import { getSiteUrl } from '@/lib/seo/og-image';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  email: z.string().email(),
});

async function findUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  // Prefer getUserByEmail if available on admin API
  const admin = supabaseAdmin.auth.admin as typeof supabaseAdmin.auth.admin & {
    getUserByEmail?: (email: string) => Promise<{ data: { user: { id: string } | null }; error: Error | null }>;
  };
  if (typeof admin.getUserByEmail === 'function') {
    const { data, error } = await admin.getUserByEmail(normalized);
    if (!error && data?.user?.id) return data.user.id;
  }

  // Fallback: scan pages (fine for low volume admin ops)
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const found = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (found) return found.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

/**
 * POST /api/business/[businessId]/assign-owner
 * Body: { email }
 * - Platform admin: puede asignar cualquier negocio
 * - Owner del negocio: puede transferir por correo
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const user = await getUserFromRouteRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const { businessId } = await context.params;
    const profile = await getProfile(user.id);
    const platformAdmin = isPlatformAdminUser(user.email, profile);

    const supabase = await createServerClient();
    const ctx = await resolveBusinessForUser(supabase, user.id, businessId);

    if (!platformAdmin) {
      if (!ctx) {
        return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
      }
      if (ctx.role !== 'owner') {
        return NextResponse.json(
          { success: false, error: 'Solo el propietario o un admin de Buscadis puede asignar el dueño' },
          { status: 403 }
        );
      }
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Correo inválido' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const { data: business, error: bizErr } = await supabaseAdmin
      .from('business_profiles')
      .select('id, name, slug, logo_url')
      .eq('id', businessId)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
    }

    const targetUserId = await findUserIdByEmail(email);
    const editUrl = `${getSiteUrl()}/@${business.slug}?edit=true`;
    const publicUrl = `${getSiteUrl()}/@${business.slug}`;
    const loginUrl = `${getSiteUrl()}/login`;

    if (targetUserId) {
      const { data: transfer, error: transferErr } = await supabaseAdmin.rpc(
        'admin_force_transfer_business_owner',
        {
          p_business_id: businessId,
          p_new_owner_user_id: targetUserId,
        }
      );

      if (transferErr) {
        return NextResponse.json({ success: false, error: transferErr.message }, { status: 400 });
      }
      const result = transfer as { ok?: boolean; error?: string } | null;
      if (!result?.ok) {
        return NextResponse.json(
          { success: false, error: result?.error || 'No se pudo transferir' },
          { status: 400 }
        );
      }

      const emailResult = await sendBusinessOwnerAssignEmail({
        toEmail: email,
        businessName: business.name || business.slug,
        mode: 'transferred',
        editUrl,
        publicUrl,
        loginUrl,
      });

      return NextResponse.json({
        success: true,
        mode: 'transferred',
        userId: targetUserId,
        emailWarning: emailResult.ok ? undefined : emailResult.error,
      });
    }

    // Usuario aún no registrado: dejar pending_owner_email
    const { error: pendingErr } = await supabaseAdmin
      .from('business_profiles')
      .update({
        pending_owner_email: email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (pendingErr) {
      return NextResponse.json({ success: false, error: pendingErr.message }, { status: 400 });
    }

    const emailResult = await sendBusinessOwnerAssignEmail({
      toEmail: email,
      businessName: business.name || business.slug,
      mode: 'pending',
      editUrl,
      publicUrl,
      loginUrl,
    });

    return NextResponse.json({
      success: true,
      mode: 'pending',
      emailWarning: emailResult.ok ? undefined : emailResult.error,
      message:
        'Cuando inicie sesión con ese correo, el negocio se le asignará automáticamente.',
    });
  } catch (error: any) {
    console.error('POST /assign-owner:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
