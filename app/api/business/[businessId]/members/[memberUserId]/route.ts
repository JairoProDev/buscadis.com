import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission, type BusinessMemberRole } from '@/lib/business-access';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
    role: z.enum(['admin', 'editor', 'viewer']),
});

/**
 * PATCH /api/business/[businessId]/members/[memberUserId]
 * Body: { role } — cannot set owner (DB trigger).
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ businessId: string; memberUserId: string }> }
) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const { businessId, memberUserId } = await context.params;
        const supabase = await createServerClient();
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx) {
            return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
        }

        if (!hasPermission(ctx.role, 'team:change_role')) {
            return NextResponse.json({ success: false, error: 'Sin permiso' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Rol inválido' }, { status: 400 });
        }

        const { data: target, error: fetchErr } = await supabase
            .from('business_members')
            .select('id, user_id, role')
            .eq('business_profile_id', businessId)
            .eq('user_id', memberUserId)
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!target) {
            return NextResponse.json({ success: false, error: 'Miembro no encontrado' }, { status: 404 });
        }

        if (target.role === 'owner') {
            return NextResponse.json({ success: false, error: 'No se puede cambiar el rol del propietario' }, { status: 400 });
        }

        const { data: updated, error: updErr } = await supabase
            .from('business_members')
            .update({ role: parsed.data.role as BusinessMemberRole, updated_at: new Date().toISOString() })
            .eq('id', target.id)
            .select()
            .single();

        if (updErr) throw updErr;

        return NextResponse.json({ success: true, member: updated });
    } catch (error: any) {
        console.error('PATCH /members:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/business/[businessId]/members/[memberUserId]
 */
export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ businessId: string; memberUserId: string }> }
) {
    try {
        const user = await getUserFromRouteRequest(_request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const { businessId, memberUserId } = await context.params;
        const supabase = await createServerClient();
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx) {
            return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
        }

        if (!hasPermission(ctx.role, 'team:remove')) {
            return NextResponse.json({ success: false, error: 'Sin permiso' }, { status: 403 });
        }

        const { data: target, error: fetchErr } = await supabase
            .from('business_members')
            .select('id, user_id, role')
            .eq('business_profile_id', businessId)
            .eq('user_id', memberUserId)
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!target) {
            return NextResponse.json({ success: false, error: 'Miembro no encontrado' }, { status: 404 });
        }

        if (target.role === 'owner') {
            return NextResponse.json({ success: false, error: 'No se puede eliminar al propietario' }, { status: 400 });
        }

        const { error: delErr } = await supabase.from('business_members').delete().eq('id', target.id);

        if (delErr) throw delErr;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE /members:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
