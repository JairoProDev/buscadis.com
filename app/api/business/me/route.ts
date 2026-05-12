/**
 * GET /api/business/me
 * Returns the business profile owned by the authenticated user.
 * Uses service role key to bypass RLS.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
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

        // Try via business_members first
        const { data: memberships } = await supabaseAdmin
            .from('business_members')
            .select('role, business_profiles(*)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1);

        if (memberships && memberships.length > 0) {
            const bp = Array.isArray((memberships[0] as any).business_profiles)
                ? (memberships[0] as any).business_profiles[0]
                : (memberships[0] as any).business_profiles;
            if (bp) return NextResponse.json({ profile: bp, role: memberships[0].role });
        }

        // Fallback: query business_profiles directly by user_id
        const { data: profile } = await supabaseAdmin
            .from('business_profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (profile) {
            return NextResponse.json({ profile, role: 'owner' });
        }

        return NextResponse.json({ profile: null });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
