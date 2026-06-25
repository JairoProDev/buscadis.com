import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { resolveBusinessForUser } from '@/lib/business-server-auth';

export const dynamic = 'force-dynamic';

const MAX = 100;

/**
 * GET /api/business/[businessId]/audit?limit=50
 * Owner/admin only — team RBAC audit trail.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ businessId: string }> }) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const { businessId } = await context.params;
        const supabase = await createServerClient();
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx) {
            return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
        }

        if (ctx.role !== 'owner' && ctx.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Sin permiso' }, { status: 403 });
        }

        const limitParam = parseInt(new URL(request.url).searchParams.get('limit') || String(MAX), 10);
        const limit = Math.min(MAX, Math.max(1, limitParam || MAX));

        const { data, error } = await supabase
            .from('business_team_audit_log')
            .select('id, actor_user_id, action, target_user_id, metadata, created_at')
            .eq('business_profile_id', businessId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return NextResponse.json({ success: true, items: data || [] });
    } catch (error: any) {
        console.error('GET /audit:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
