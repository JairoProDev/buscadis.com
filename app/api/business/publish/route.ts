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
import { revalidateTag } from 'next/cache';
import { BUSINESS_CACHE_TAG } from '@/lib/business/seo';
import { isPlatformAdminEmail, isPlatformAdminProfile } from '@/lib/platform-admin';
import { ensureQrCodeForBusiness, eagerGenerateQrPng } from '@/lib/qr/service';

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
        const { businessId, is_published, updates, action } = body;

        // CREATE NEW BUSINESS (Bypass RLS)
        if (action === 'create') {
            if (!updates || !updates.name) {
                return NextResponse.json({ error: 'Nombre de negocio requerido' }, { status: 400 });
            }
            const safePayload = sanitizeBusinessProfilePayload(updates) as Record<string, unknown>;
            // Force ownership to the authenticated user
            safePayload.user_id = user.id;
            safePayload.created_by = user.id;
            // Generate slug if missing
            if (!safePayload.slug) {
                safePayload.slug = String(safePayload.name || 'negocio')
                    .toLowerCase()
                    .replace(/\s+/g, '-');
            }

            const { data: inserted, error: insertError } = await supabaseAdmin
                .from('business_profiles')
                .insert([safePayload])
                .select()
                .single();

            if (insertError) {
                console.error('Error creating business profile via admin API:', insertError);
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }

            if (inserted?.id && inserted?.slug) {
                await ensureQrCodeForBusiness({
                    businessProfileId: inserted.id,
                    slug: inserted.slug,
                    themeColor: inserted.theme_color,
                });
            }

            return NextResponse.json({ success: true, profile: inserted });
        }

        if (!businessId) {
            return NextResponse.json({ error: 'businessId requerido para actualizar' }, { status: 400 });
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

        // Check ownership: by user_id field OR by business_members OR platform admin
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
        if (!isAuthorized) {
            if (isPlatformAdminEmail(user.email)) {
                isAuthorized = true;
            } else {
                const { data: adminProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('rol, is_platform_admin')
                    .eq('id', user.id)
                    .maybeSingle();
                isAuthorized = isPlatformAdminProfile(adminProfile);
            }
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

        if (updated?.slug) {
            revalidateTag(BUSINESS_CACHE_TAG(updated.slug));
            await ensureQrCodeForBusiness({
                businessProfileId: updated.id,
                slug: updated.slug,
                themeColor: updated.theme_color,
            });

            const changedFields = updates && typeof updates === 'object'
                ? Object.keys(updates)
                : [];
            if (changedFields.length > 0) {
                const { invalidateQrOnProfileChange } = await import('@/lib/qr/service');
                await invalidateQrOnProfileChange(updated.id, changedFields);
            }

            if (updated.is_published) {
                void eagerGenerateQrPng({
                    businessProfileId: updated.id,
                    slug: updated.slug,
                    themeColor: updated.theme_color,
                    logoUrl: updated.logo_url,
                });
            }
        }

        return NextResponse.json({ success: true, profile: updated });

    } catch (err: any) {
        console.error('Error in /api/business/publish:', err);
        return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
    }
}
