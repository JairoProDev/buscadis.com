/**
 * POST /api/business/subscription/activate
 *
 * DEV-ONLY stub that flips a business to the 'pro' tier so publishing can be
 * tested end-to-end without a real payment. The production path is the
 * MercadoPago checkout + /api/business/subscription/webhook.
 *
 * Guarded by PUBLISH_DEV_BYPASS=true (never enable in production).
 *
 * Body: { businessId: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isPlatformAdminEmail, isPlatformAdminProfile } from '@/lib/platform-admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (process.env.PUBLISH_DEV_BYPASS !== 'true') {
      return NextResponse.json(
        { error: 'Activación por pago no disponible en este entorno.' },
        { status: 403 }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { businessId } = await req.json();
    if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

    const { data: profile } = await supabaseAdmin
      .from('business_profiles')
      .select('id, user_id')
      .eq('id', businessId)
      .single();
    if (!profile) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });

    let authorized = profile.user_id === user.id;
    if (!authorized) {
      const { data: membership } = await supabaseAdmin
        .from('business_members')
        .select('role')
        .eq('business_profile_id', businessId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      authorized = !!(membership?.role && ['owner', 'admin', 'editor'].includes(membership.role));
    }
    if (!authorized && isPlatformAdminEmail(user.email)) authorized = true;
    if (!authorized) {
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('rol, is_platform_admin')
        .eq('id', user.id)
        .maybeSingle();
      authorized = isPlatformAdminProfile(adminProfile);
    }
    if (!authorized) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

    const { data: updated, error } = await supabaseAdmin
      .from('business_profiles')
      .update({ subscription_tier: 'pro', updated_at: new Date().toISOString() })
      .eq('id', businessId)
      .select('id, subscription_tier')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, profile: updated });
  } catch (e) {
    console.error('[subscription/activate]', e);
    return NextResponse.json({ error: (e as Error).message || 'Error interno' }, { status: 500 });
  }
}
