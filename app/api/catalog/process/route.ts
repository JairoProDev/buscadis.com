/**
 * API Route: Process Uploaded Files with AI
 * Extracts products from PDF, images, or Excel using Gemini AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessIdFromRequest, resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import {
    extractProductsFromPDF,
    detectProductsInImage,
    generateProductContent
} from '@/lib/ai/gemini';
import type { SupabaseClient } from '@supabase/supabase-js';
import { withNewCatalogProductIds } from '@/lib/catalog/product-id';

async function getBackgroundSupabase(): Promise<SupabaseClient | null> {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        return supabaseAdmin;
    }
    const { supabase } = await import('@/lib/supabase');
    return supabase;
}

export async function POST(request: NextRequest) {
    const ip = getClientIP(request);
    const limitResult = rateLimit(`catalog-process-${ip}`, {
        windowMs: 60 * 1000,
        maxRequests: 8,
    });
    if (!limitResult.allowed) {
        return NextResponse.json(
            { success: false, error: 'Demasiadas solicitudes. Espera un momento.' },
            { status: 429 }
        );
    }

    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        const supabase = await createServerClient();
        const body = await request.json();
        const businessId = getBusinessIdFromRequest(request, body);
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx || !hasPermission(ctx.role, 'catalog:write')) {
            return NextResponse.json(
                { success: false, error: 'Perfil de negocio no encontrado o sin permiso' },
                { status: ctx ? 403 : 404 }
            );
        }
        const profile = { id: ctx.id };

        const { files, options } = body;

        if (!files || files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No se proporcionaron archivos' },
                { status: 400 }
            );
        }

        const { data: importRecord, error: importError } = await supabase
            .from('catalog_imports')
            .insert({
                business_profile_id: profile.id,
                file_type: files.length === 1 ? getFileType(files[0].type) : 'multiple',
                file_url: files[0].url,
                file_name: files[0].name,
                file_size: files[0].size,
                status: 'processing',
                processing_options: options || {}
            })
            .select()
            .single();

        if (importError) {
            return NextResponse.json(
                { success: false, error: 'Error al crear registro de importación' },
                { status: 500 }
            );
        }

        processFilesInBackground(importRecord.id, profile.id, files, options);

        return NextResponse.json({
            success: true,
            importId: importRecord.id,
            message: 'Procesamiento iniciado. Puedes consultar el progreso.',
            estimatedTime: files.length * 10
        });

    } catch (error: any) {
        console.error('Process error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error al procesar archivos' },
            { status: 500 }
        );
    }
}

async function processFilesInBackground(
    importId: string,
    businessProfileId: string,
    files: any[],
    options: any
) {
    const supabase = await getBackgroundSupabase();
    if (!supabase) {
        console.error('Supabase not configured for background import');
        return;
    }

    try {
        await supabase
            .from('catalog_imports')
            .update({
                status: 'processing',
                current_step: 'extracting',
                started_at: new Date().toISOString()
            })
            .eq('id', importId);

        let allProducts: any[] = [];
        let totalTokens = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = Math.round(((i + 1) / files.length) * 80);

            await supabase
                .from('catalog_imports')
                .update({ progress })
                .eq('id', importId);

            try {
                let products: any[] = [];

                if (file.type === 'application/pdf') {
                    products = await extractProductsFromPDF(file.url);
                } else if (file.type.startsWith('image/')) {
                    products = await detectProductsInImage(file.url);
                }

                allProducts.push(...products);
                totalTokens += 1000;

            } catch (error: any) {
                console.error(`Error processing file ${file.name}:`, error);
            }
        }

        await supabase
            .from('catalog_imports')
            .update({
                progress: 80,
                current_step: 'enhancing',
                products_found: allProducts.length
            })
            .eq('id', importId);

        if (options?.generate_descriptions && allProducts.length > 0) {
            for (let i = 0; i < allProducts.length; i++) {
                const product = allProducts[i];

                if (!product.description) {
                    try {
                        const content = await generateProductContent(product.images?.[0]?.url || '');
                        product.description = content.description;
                        product.tags = content.tags || [];
                    } catch (error) {
                        console.error('Error generating description:', error);
                    }
                }

                const progress = 80 + Math.round(((i + 1) / allProducts.length) * 15);
                await supabase
                    .from('catalog_imports')
                    .update({ progress })
                    .eq('id', importId);
            }
        }

        await supabase
            .from('catalog_imports')
            .update({
                progress: 95,
                current_step: 'saving'
            })
            .eq('id', importId);

        const productsToInsert = allProducts.map(p => ({
            business_profile_id: businessProfileId,
            title: p.title,
            description: p.description,
            price: p.price,
            currency: p.currency || 'PEN',
            attributes: p.attributes || {},
            tags: p.tags || [],
            images: p.images || [],
            status: 'draft',
            ai_metadata: {
                extracted_from: 'pdf',
                confidence_score: p.confidence,
                auto_generated: ['title', 'description'],
                source_file_url: files[0].url
            }
        }));

        const { data: insertedProducts, error: insertError } = await supabase
            .from('catalog_products')
            .insert(withNewCatalogProductIds(productsToInsert))
            .select();

        if (insertError) {
            throw insertError;
        }

        await supabase
            .from('catalog_imports')
            .update({
                status: 'completed',
                progress: 100,
                products_imported: insertedProducts?.length || 0,
                ai_tokens_used: totalTokens,
                ai_cost_estimate: totalTokens * 0.000075 / 1000,
                completed_at: new Date().toISOString()
            })
            .eq('id', importId);

    } catch (error: any) {
        console.error('Background processing error:', error);

        await supabase
            .from('catalog_imports')
            .update({
                status: 'failed',
                error_message: error.message
            })
            .eq('id', importId);
    }
}

function getFileType(mimeType: string): 'pdf' | 'image' | 'excel' {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    return 'excel';
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const businessId = getBusinessIdFromRequest(request, null);
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx || !hasPermission(ctx.role, 'catalog:read')) {
            return NextResponse.json(
                { success: false, error: 'Perfil de negocio no encontrado o sin permiso' },
                { status: ctx ? 403 : 404 }
            );
        }
        const profile = { id: ctx.id };

        const importId = searchParams.get('importId');

        if (!importId) {
            return NextResponse.json(
                { success: false, error: 'importId requerido' },
                { status: 400 }
            );
        }

        const { data: importRecord, error } = await supabase
            .from('catalog_imports')
            .select('*')
            .eq('id', importId)
            .single();

        if (error || !importRecord) {
            return NextResponse.json(
                { success: false, error: 'Importación no encontrada' },
                { status: 404 }
            );
        }

        if (importRecord.business_profile_id !== profile.id) {
            return NextResponse.json(
                { success: false, error: 'Importación no encontrada' },
                { status: 404 }
            );
        }

        let products = [];
        if (importRecord.status === 'completed') {
            const { data: productsData } = await supabase
                .from('catalog_products')
                .select('*')
                .eq('business_profile_id', importRecord.business_profile_id)
                .contains('ai_metadata', { source_file_url: importRecord.file_url });

            products = productsData || [];
        }

        return NextResponse.json({
            success: true,
            import: importRecord,
            products: importRecord.status === 'completed' ? products : []
        });

    } catch (error: any) {
        console.error('Get import error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
