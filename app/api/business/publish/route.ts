/**
 * POST /api/business/publish
 * Publishes or unpublishes a business profile.
 * Uses the service role key to bypass RLS, but first verifies the user's JWT
 * to ensure they are authenticated.
 *
 * Body: { businessId: string, is_published: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeBusinessProfilePayload } from '@/lib/business';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        // 1. Verify the user is authenticated via their JWT
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        // 2. Parse request body
        const body = await req.json();
        const { businessId, is_published, updates } = body;
        if (!businessId) {
            return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });
        }

        // 3. Verify the user owns this business (by user_id OR business_members)
        const { data: profile } = await supabaseAdmin
            .from('business_profiles')
            .select('id, user_id')
            .eq('id', businessId)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
        }

        // Check ownership: by user_id field OR by business_members
        let isAuthorized = profile.user_id === user.id;
        if (!isAuthorized) {
            const { data: membership } = await supabaseAdmin
                .from('business_members')
                .select('role')
                .eq('business_profile_id', businessId)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .maybeSingle();
            isAuthorized = !!(membership?.role && ['owner', 'admin', 'editor'].includes(membership.role));
        }

        // FALLBACK: if still not authorized, check if the user created/owns the profile
        // by trying a broader check (email match, etc.) — for legacy data
        if (!isAuthorized) {
            // Allow if the profile has no user_id set (orphaned profile), we claim it
            if (!profile.user_id) {
                // Adopt this profile for the current user
                await supabaseAdmin
                    .from('business_profiles')
                    .update({ user_id: user.id })
                    .eq('id', businessId);
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ 
                error: `Sin permiso. Tu ID: ${user.id}, Propietario: ${profile.user_id || 'sin propietario'}` 
            }, { status: 403 });
        }

        // 4. Perform the update using admin client (bypasses RLS)
        const updatePayload: any = {
            updated_at: new Date().toISOString(),
        };

        // If is_published is explicitly provided, set it
        if (typeof is_published === 'boolean') {
            updatePayload.is_published = is_published;
        }

        // If updates object is provided (for save), merge it
        if (updates && typeof updates === 'object') {
            // Exclude fields that shouldn't be updated, then sanitize
            const { id, created_at, updated_at, ...rawUpdates } = updates;
            const safeUpdates = sanitizeBusinessProfilePayload(rawUpdates);
            Object.assign(updatePayload, safeUpdates);
        }

        const { data: updated, error: updateError } = await supabaseAdmin
            .from('business_profiles')
            .update(updatePayload)
            .eq('id', businessId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating business profile:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile: updated });

    } catch (err: any) {
        console.error('Error in /api/business/publish:', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
