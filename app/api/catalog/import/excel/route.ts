/**
 * CATALOG AI - Excel Import API
 * 
 * Endpoint: POST /api/catalog/import/excel
 * 
 * Flujo:
 * 1. Parse Excel file
 * 2. AI-powered column detection & mapping
 * 3. Product normalization
 * 4. Duplicate detection
 * 5. Create import session
 * 6. Return results for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { getBusinessIdFromRequest, resolveBusinessForUser } from '@/lib/business-server-auth';
import { hasPermission } from '@/lib/business-access';
import { ExcelParser } from '@/lib/ai/excel-parser';
import { withNewCatalogProductIds } from '@/lib/catalog/product-id';
import { ProductNormalizer } from '@/lib/ai/product-normalizer';
import { DuplicateDetector } from '@/lib/ai/duplicate-detector';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large files

interface ImportStats {
    totalRows: number;
    productsToCreate: number;
    duplicatesFound: number;
    errors: number;
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        const formData = await request.formData();
        const businessIdRaw = formData.get('business_id') ?? formData.get('business_profile_id');
        const businessId =
            typeof businessIdRaw === 'string' && businessIdRaw.length > 0 ? businessIdRaw : null;
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx || !hasPermission(ctx.role, 'catalog:write')) {
            return NextResponse.json(
                { error: ctx ? 'Forbidden' : 'Business profile not found' },
                { status: ctx ? 403 : 404 }
            );
        }
        const profile = { id: ctx.id };

        // 3. Get file from form data
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
            return NextResponse.json({
                error: 'Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file.'
            }, { status: 400 });
        }

        // 4. Create import session (Using admin)
        const { data: importSession, error: sessionError } = await supabaseAdmin
            .from('import_sessions')
            .insert({
                business_profile_id: profile.id,
                source_type: 'excel',
                source_file_name: file.name,
                status: 'processing',
                created_by: user.id,
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (sessionError || !importSession) {
            console.error('Error creating import session:', sessionError);
            return NextResponse.json({ error: 'Failed to create import session' }, { status: 500 });
        }

        // 5. Parse Excel file
        console.log('Step 5: Parsing Excel file...');
        const buffer = await file.arrayBuffer();
        const excelParser = new ExcelParser();
        const parsedData = await excelParser.parse(Buffer.from(buffer));
        console.log(`Parsed ${parsedData.rows.length} rows`);

        if (parsedData.rows.length === 0) {
            await supabaseAdmin
                .from('import_sessions')
                .update({ status: 'failed', error_details: { message: 'No data found in file' } })
                .eq('id', importSession.id);

            return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
        }

        // 6. AI Column Mapping
        console.log('Step 6: AI Column Mapping...');
        const normalizer = new ProductNormalizer();
        const columnMapping = await normalizer.detectColumns(parsedData.headers, parsedData.rows[0]);
        console.log('Column mapping detected:', columnMapping);

        // 7. Normalize products
        console.log('Step 7: Normalizing products...');
        const normalizedProducts = [];
        const errors = [];

        // We process rows using the proper normalizer but skip the AI enrichment per row
        for (let i = 0; i < parsedData.rows.length; i++) {
            try {
                const normalized = await normalizer.normalize(parsedData.rows[i], columnMapping, parsedData.headers, {
                    skipEnrichment: true
                });

                normalizedProducts.push({
                    ...normalized,
                    importRowNumber: i + 2,
                    import_source: 'excel',
                    import_source_file: file.name
                });
            } catch (error: any) {
                console.error(`Error in row ${i + 2}:`, error.message);
                errors.push({ row: i + 2, error: error.message });
            }
        }
        console.log(`Normalized ${normalizedProducts.length} products successfully`);

        // 8. Duplicate Detection
        console.log('Step 8: Duplicate Detection...');
        const duplicateDetector = new DuplicateDetector(supabaseAdmin);
        // Process in smaller chunks if needed, but for now direct batch
        const detectionResults = await duplicateDetector.detectBatch(
            normalizedProducts,
            profile.id
        );

        // 9. Separate into Create vs Review
        const toCreate = detectionResults.filter(r => !r.isDuplicate);
        const toReview = detectionResults.filter(r => r.isDuplicate);
        console.log(`To create: ${toCreate.length}, To review: ${toReview.length}`);

        // 10. Store duplicate candidates for review
        if (toReview.length > 0) {
            console.log('Step 10: Storing duplicate candidates...');
            const duplicateCandidates = toReview.map(item => ({
                import_session_id: importSession.id,
                new_product_data: item.product,
                existing_product_id: item.matchedProduct?.id,
                similarity_score: item.score,
                match_reasons: item.reasons
            }));

            await supabaseAdmin
                .from('duplicate_candidates')
                .insert(duplicateCandidates);
        }

        // 11. Auto-create products with low duplicate risk
        const autoCreateThreshold = 0.5;
        const autoCreate = toCreate.filter(r => (r.score || 0) < autoCreateThreshold);

        let productsCreated = 0;
        let insertErr: any = null;

        if (autoCreate.length > 0) {
            console.log(`Step 11: Auto-creating ${autoCreate.length} products...`);

            // Define allowed columns to prevent DB errors
            const allowedColumns = [
                'business_profile_id', 'title', 'description', 'sku', 'barcode',
                'price', 'compare_at_price', 'currency', 'category', 'brand',
                'supplier', 'stock', 'attributes', 'images', 'status',
                'import_source', 'import_source_file', 'import_confidence'
            ];

            const productsToInsert = autoCreate.map(r => {
                const pSource = r.product; // This is the normalized product
                const cleanProduct: any = {};

                // Map standard fields
                if (pSource.title) cleanProduct.title = pSource.title;
                if (pSource.description) cleanProduct.description = pSource.description;
                if (pSource.sku) cleanProduct.sku = pSource.sku;
                if (pSource.barcode) cleanProduct.barcode = pSource.barcode;

                // Price handling
                if (pSource.price !== undefined && pSource.price !== null) cleanProduct.price = parseFloat(pSource.price);

                if (pSource.category) cleanProduct.category = pSource.category;
                if (pSource.brand) cleanProduct.brand = pSource.brand;
                if (pSource.supplier) cleanProduct.supplier = pSource.supplier;
                if (pSource.stock !== undefined) cleanProduct.stock = parseInt(pSource.stock);

                // Attributes and Images
                if (pSource.attributes) cleanProduct.attributes = pSource.attributes; // Supabase handles object -> jsonb
                if (pSource.images) cleanProduct.images = pSource.images;

                // Set required/system fields
                cleanProduct.business_profile_id = profile.id;
                cleanProduct.status = 'published';
                cleanProduct.import_source = 'excel';
                cleanProduct.import_source_file = file.name;
                cleanProduct.import_confidence = 1 - (r.score || 0);

                return cleanProduct;
            });

            const { error: insertError } = await supabaseAdmin
                .from('catalog_products')
                .insert(withNewCatalogProductIds(productsToInsert));

            if (insertError) {
                console.error('Insert error details:', JSON.stringify(insertError, null, 2));
                insertErr = insertError;
            } else {
                productsCreated = productsToInsert.length;
                console.log(`Successfully created ${productsCreated} products`);
            }
        }

        // 12. Update import session
        console.log('Step 12: Updating import session status...');
        const stats: ImportStats = {
            totalRows: parsedData.rows.length,
            productsToCreate: autoCreate.length,
            duplicatesFound: toReview.length,
            errors: errors.length
        };

        const finalStatus = insertErr ? 'failed' : (toReview.length > 0 ? 'review_needed' : 'completed');

        await supabaseAdmin
            .from('import_sessions')
            .update({
                status: finalStatus,
                total_rows: stats.totalRows,
                products_created: productsCreated,
                duplicates_found: stats.duplicatesFound,
                errors_count: stats.errors + (insertErr ? 1 : 0),
                error_details: {
                    errors: errors.slice(0, 10),
                    insertError: insertErr
                },
                processing_log: {
                    columnMapping,
                    stats
                },
                completed_at: new Date().toISOString()
            })
            .eq('id', importSession.id);

        console.log(`Import completed with status: ${finalStatus}`);
        // 13. Return results
        return NextResponse.json({
            success: !insertErr,
            sessionId: importSession.id,
            stats,
            columnMapping,
            needsReview: toReview.length > 0,
            duplicates: toReview.slice(0, 50).map(r => ({ // Don't send too many to avoid response size limits
                newProduct: r.product,
                existingProduct: r.matchedProduct,
                score: r.score,
                reasons: r.reasons
            })),
            errors: errors.slice(0, 10),
            error: insertErr ? 'Partial success: products could not be saved' : undefined
        });

    } catch (error: any) {
        console.error('Excel import error:', error);
        return NextResponse.json({
            error: 'Import failed',
            details: error.message
        }, { status: 500 });
    }
}

// GET endpoint to check status of an import
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRouteRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const businessId = getBusinessIdFromRequest(request, null);
        const ctx = await resolveBusinessForUser(supabase, user.id, businessId);
        if (!ctx || !hasPermission(ctx.role, 'catalog:read')) {
            return NextResponse.json(
                { error: ctx ? 'Forbidden' : 'Business profile not found' },
                { status: ctx ? 403 : 404 }
            );
        }
        const profile = { id: ctx.id };

        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        }

        const { data: session, error } = await supabase
            .from('import_sessions')
            .select(`
                *,
                duplicate_candidates (
                    id,
                    new_product_data,
                    existing_product_id,
                    similarity_score,
                    match_reasons,
                    resolution
                )
            `)
            .eq('id', sessionId)
            .single();

        if (error || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        if (session.business_profile_id !== profile.id) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(session);

    } catch (error: any) {
        return NextResponse.json({
            error: 'Failed to fetch session',
            details: error.message
        }, { status: 500 });
    }
}
