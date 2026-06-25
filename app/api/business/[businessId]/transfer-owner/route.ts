import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { resolveBusinessForUser } from '@/lib/business-server-auth';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
    newOwnerUserId: z.string().uuid(),
});

/**
 * POST /api/business/[businessId]/transfer-owner
 * Body: { newOwnerUserId } — only current owner; new user must already be an active member.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ businessId: string }> }) {
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

        if (ctx.role !== 'owner') {
            return NextResponse.json(
                { success: false, error: 'Solo el propietario puede transferir el negocio' },
                { status: 403 }
            );
        }

        const raw = await request.json().catch(() => ({}));
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'newOwnerUserId inválido' }, { status: 400 });
        }

        const { data, error } = await supabase.rpc('transfer_business_owner', {
            p_business_id: businessId,
            p_new_owner_user_id: parsed.data.newOwnerUserId,
        });

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        const result = data as { ok?: boolean; error?: string } | null;
        if (!result?.ok) {
            const code = result?.error || 'failed';
            const status =
                code === 'not_owner' || code === 'not_authenticated'
                    ? 403
                    : code === 'new_owner_not_member' || code === 'same_user'
                      ? 400
                      : 400;
            return NextResponse.json({ success: false, error: code }, { status });
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('POST /transfer-owner:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
