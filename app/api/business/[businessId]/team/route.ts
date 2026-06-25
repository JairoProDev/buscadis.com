import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

async function getEmailForUserId(userId: string): Promise<string | null> {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (error || !data.user?.email) return null;
        return data.user.email;
    } catch {
        return null;
    }
}

/**
 * GET /api/business/[businessId]/team
 * Lists members (with emails) and pending invitations.
 */
export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ businessId: string }> }
) {
    try {
        const user = await getUserFromRouteRequest(_request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const { businessId } = await context.params;
        const supabase = await createServerClient();
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx) {
            return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
        }

        if (!hasPermission(ctx.role, 'team:read')) {
            return NextResponse.json({ success: false, error: 'Sin permiso' }, { status: 403 });
        }

        const { data: members, error: memErr } = await supabase
            .from('business_members')
            .select('id, user_id, role, status, created_at, invited_by')
            .eq('business_profile_id', businessId)
            .order('created_at', { ascending: true });

        if (memErr) throw memErr;

        const memberRows = members || [];
        const emails = await Promise.all(memberRows.map((m) => getEmailForUserId(m.user_id)));

        const { data: invitations, error: invErr } = await supabase
            .from('business_invitations')
            .select('id, email, role, status, expires_at, created_at, invited_by')
            .eq('business_profile_id', businessId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (invErr) throw invErr;

        return NextResponse.json({
            success: true,
            business: {
                id: ctx.id,
                name: ctx.name,
                slug: ctx.slug,
            },
            yourRole: ctx.role,
            members: memberRows.map((m, i) => ({
                ...m,
                email: emails[i] ?? null,
            })),
            invitations: invitations || [],
        });
    } catch (error: any) {
        console.error('GET /team:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
