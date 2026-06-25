import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendBusinessTeamInviteEmail, getInvitationAcceptUrl } from '@/lib/email-business-invite';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'editor', 'viewer']),
});

async function getEmailForUserId(userId: string): Promise<string | null> {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (error || !data.user?.email) return null;
        return data.user.email;
    } catch {
        return null;
    }
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    editor: 'Editor',
    viewer: 'Solo lectura',
};

/**
 * POST /api/business/[businessId]/invite
 * Body: { email, role }
 */
export async function POST(request: NextRequest, context: { params: Promise<{ businessId: string }> }) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const ip = getClientIP(request);
        const limited = rateLimit(`business-invite-${ip}-${user.id}`, {
            windowMs: 60 * 60 * 1000,
            maxRequests: 25,
        });
        if (!limited.allowed) {
            return NextResponse.json(
                { success: false, error: 'Demasiadas invitaciones en esta hora. Intenta más tarde.' },
                { status: 429 }
            );
        }

        const { businessId } = await context.params;
        const supabase = await createServerClient();
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx) {
            return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
        }

        if (!hasPermission(ctx.role, 'team:invite')) {
            return NextResponse.json({ success: false, error: 'Sin permiso para invitar' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const parsed = postSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Email o rol inválido' }, { status: 400 });
        }

        const emailNorm = parsed.data.email.trim().toLowerCase();

        const { data: members } = await supabase
            .from('business_members')
            .select('user_id')
            .eq('business_profile_id', businessId)
            .eq('status', 'active');

        for (const m of members || []) {
            const em = await getEmailForUserId(m.user_id);
            if (em && em.trim().toLowerCase() === emailNorm) {
                return NextResponse.json(
                    { success: false, error: 'Ese correo ya es miembro del equipo' },
                    { status: 409 }
                );
            }
        }

        const token = nanoid(48);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: row, error: insErr } = await supabase
            .from('business_invitations')
            .insert({
                business_profile_id: businessId,
                email: emailNorm,
                role: parsed.data.role,
                token,
                invited_by: user.id,
                status: 'pending',
                expires_at: expiresAt,
            })
            .select('id, email, role, expires_at, created_at')
            .single();

        if (insErr) {
            if (insErr.code === '23505') {
                return NextResponse.json(
                    { success: false, error: 'Ya hay una invitación pendiente para ese correo' },
                    { status: 409 }
                );
            }
            throw insErr;
        }

        const inviterEmail = user.email || (await getEmailForUserId(user.id)) || 'Un administrador';
        const acceptUrl = getInvitationAcceptUrl(token);

        const send = await sendBusinessTeamInviteEmail({
            toEmail: emailNorm,
            businessName: ctx.name || ctx.slug,
            inviterLabel: inviterEmail,
            roleLabel: ROLE_LABELS[parsed.data.role] || parsed.data.role,
            acceptUrl,
        });

        return NextResponse.json({
            success: true,
            invitation: row,
            emailSent: send.ok,
            emailWarning: send.ok ? undefined : 'Invitación creada; configura RESEND_API_KEY para enviar el correo.',
            acceptUrl: process.env.NODE_ENV === 'development' ? acceptUrl : undefined,
        });
    } catch (error: any) {
        console.error('POST /invite:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/business/[businessId]/invite?invitationId=
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ businessId: string }> }) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const { businessId } = await context.params;
        const invitationId = new URL(request.url).searchParams.get('invitationId');
        if (!invitationId) {
            return NextResponse.json({ success: false, error: 'invitationId requerido' }, { status: 400 });
        }

        const supabase = await createServerClient();
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx) {
            return NextResponse.json({ success: false, error: 'Negocio no encontrado' }, { status: 404 });
        }

        if (!hasPermission(ctx.role, 'team:invite')) {
            return NextResponse.json({ success: false, error: 'Sin permiso' }, { status: 403 });
        }

        const { error } = await supabase
            .from('business_invitations')
            .delete()
            .eq('id', invitationId)
            .eq('business_profile_id', businessId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE /invite:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
