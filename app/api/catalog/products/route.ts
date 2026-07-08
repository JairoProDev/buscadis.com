/**
 * API Route: CRUD for Catalog Products (sesión servidor + RLS)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessIdFromRequest, resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';

const UPDATABLE_FIELDS = [
    'title',
    'description',
    'price',
    'compare_at_price',
    'currency',
    'category',
    'tags',
    'attributes',
    'images',
    'sku',
    'barcode',
    'stock',
    'track_inventory',
    'status',
    'ai_metadata',
    'sort_order',
    'is_featured',
] as const;

type CatalogPerm = 'catalog:read' | 'catalog:write';

async function resolveCatalogBusiness(
    request: NextRequest,
    supabase: Awaited<ReturnType<typeof createServerClient>>,
    userId: string,
    body: Record<string, unknown> | null | undefined,
    minPerm: CatalogPerm
) {
    const businessId = getBusinessIdFromRequest(request, body ?? null);
    const ctx = await resolveBusinessForUser(supabase, userId, businessId);
    if (!ctx || !hasPermission(ctx.role, minPerm)) {
        return { profile: null as { id: string } | null, error: ctx ? 'forbidden' : 'not_found' };
    }
    return { profile: { id: ctx.id }, error: null as string | null };
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const supabase = await createServerClient();
        const { profile, error: profileError } = await resolveCatalogBusiness(
            request,
            supabase,
            user.id,
            null,
            'catalog:read'
        );
        if (profileError === 'not_found' || !profile) {
            return NextResponse.json(
                { success: false, error: 'Perfil de negocio no encontrado o sin acceso' },
                { status: 404 }
            );
        }
        if (profileError === 'forbidden') {
            return NextResponse.json({ success: false, error: 'Sin permiso para el catálogo' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const perPage = parseInt(searchParams.get('per_page') || '20', 10);

        let query = supabase
            .from('catalog_products')
            .select('*', { count: 'exact' })
            .eq('business_profile_id', profile.id);

        if (status) {
            query = query.eq('status', status);
        }
        if (category) {
            query = query.eq('category', category);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const from = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, perPage));
        const limit = Math.min(100, Math.max(1, perPage));
        const to = from + limit - 1;

        query = query
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
            .range(from, to);

        const { data: products, error, count } = await query;
        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            items: products || [],
            total: count || 0,
            page: Math.max(1, page),
            per_page: limit,
            has_more: count != null ? from + limit < count : false,
        });
    } catch (error: any) {
        console.error('Get products error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const supabase = await createServerClient();
        const body = await request.json().catch(() => ({}));
        const { profile, error: profileError } = await resolveCatalogBusiness(
            request,
            supabase,
            user.id,
            body,
            'catalog:write'
        );
        if (profileError === 'not_found' || !profile) {
            return NextResponse.json(
                { success: false, error: 'Perfil de negocio no encontrado o sin acceso' },
                { status: 404 }
            );
        }
        if (profileError === 'forbidden') {
            return NextResponse.json({ success: false, error: 'Sin permiso para el catálogo' }, { status: 403 });
        }
        if (!body.title) {
            return NextResponse.json(
                { success: false, error: 'El título es requerido' },
                { status: 400 }
            );
        }

        const { data: product, error } = await supabase
            .from('catalog_products')
            .insert({
                business_profile_id: profile.id,
                title: body.title,
                description: body.description,
                price: body.price,
                compare_at_price: body.compare_at_price,
                currency: body.currency || 'PEN',
                category: body.category,
                tags: body.tags || [],
                attributes: body.attributes || {},
                images: body.images || [],
                sku: body.sku,
                barcode: body.barcode,
                stock: body.stock,
                track_inventory: body.track_inventory || false,
                status: body.status || 'draft',
                ai_metadata: body.ai_metadata || {},
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data: product,
            message: 'Producto creado correctamente',
        });
    } catch (error: any) {
        console.error('Create product error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const supabase = await createServerClient();
        const body = await request.json().catch(() => ({}));
        const { profile, error: profileError } = await resolveCatalogBusiness(
            request,
            supabase,
            user.id,
            body,
            'catalog:write'
        );
        if (profileError === 'not_found' || !profile) {
            return NextResponse.json(
                { success: false, error: 'Perfil de negocio no encontrado o sin acceso' },
                { status: 404 }
            );
        }
        if (profileError === 'forbidden') {
            return NextResponse.json({ success: false, error: 'Sin permiso para el catálogo' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('id');
        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'ID de producto requerido' },
                { status: 400 }
            );
        }
        const patch: Record<string, unknown> = {};
        for (const key of UPDATABLE_FIELDS) {
            if (key in body) {
                patch[key] = body[key];
            }
        }
        patch.updated_at = new Date().toISOString();

        if (Object.keys(patch).length <= 1) {
            return NextResponse.json(
                { success: false, error: 'No hay campos permitidos para actualizar' },
                { status: 400 }
            );
        }

        const { data: product, error } = await supabase
            .from('catalog_products')
            .update(patch)
            .eq('id', productId)
            .eq('business_profile_id', profile.id)
            .select()
            .single();

        if (error) {
            throw error;
        }
        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Producto no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: product,
            message: 'Producto actualizado correctamente',
        });
    } catch (error: any) {
        console.error('Update product error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const supabase = await createServerClient();
        const { profile, error: profileError } = await resolveCatalogBusiness(
            request,
            supabase,
            user.id,
            null,
            'catalog:write'
        );
        if (profileError === 'not_found' || !profile) {
            return NextResponse.json(
                { success: false, error: 'Perfil de negocio no encontrado o sin acceso' },
                { status: 404 }
            );
        }
        if (profileError === 'forbidden') {
            return NextResponse.json({ success: false, error: 'Sin permiso para el catálogo' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('id');
        if (!productId) {
            return NextResponse.json(
                { success: false, error: 'ID de producto requerido' },
                { status: 400 }
            );
        }

        const { data: deletedRows, error } = await supabase
            .from('catalog_products')
            .delete()
            .eq('id', productId)
            .eq('business_profile_id', profile.id)
            .select('id');

        if (error) {
            throw error;
        }
        if (!deletedRows?.length) {
            return NextResponse.json(
                { success: false, error: 'Producto no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Producto eliminado correctamente',
        });
    } catch (error: any) {
        console.error('Delete product error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
