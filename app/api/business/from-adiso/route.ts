/**
 * POST /api/business/from-adiso
 * Convierte un aviso del usuario en borrador de negocio + productos semilla.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeBusinessProfilePayload } from '@/lib/business';
import { mapAdisoAPerfil } from '@/lib/business/adiso-a-perfil';
import { dbToAdiso } from '@/lib/supabase';
import { ensureQrCodeForBusiness } from '@/lib/qr/service';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const adisoId = body.adisoId as string | undefined;
    if (!adisoId) {
      return NextResponse.json({ error: 'adisoId requerido' }, { status: 400 });
    }

    const { data: row, error: adisoError } = await supabaseAdmin
      .from('adisos')
      .select('*')
      .eq('id', adisoId)
      .maybeSingle();

    if (adisoError || !row) {
      return NextResponse.json({ error: 'Aviso no encontrado' }, { status: 404 });
    }

    const ownerId = row.user_id || row.usuario_id;
    if (ownerId !== user.id) {
      return NextResponse.json({ error: 'No es tu aviso' }, { status: 403 });
    }

    const adiso = dbToAdiso(row);
    const { profile: prefill, productosSemilla } = mapAdisoAPerfil(adiso);

    const safePayload = sanitizeBusinessProfilePayload({
      ...prefill,
      is_published: false,
    }) as Record<string, unknown>;
    safePayload.user_id = user.id;
    safePayload.created_by = user.id;
    if (!safePayload.slug) {
      safePayload.slug = String(safePayload.name || 'negocio')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('business_profiles')
      .insert([safePayload])
      .select()
      .single();

    if (insertError) {
      console.error('[from-adiso] insert', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (inserted?.id && inserted?.slug) {
      await ensureQrCodeForBusiness({
        businessProfileId: inserted.id,
        slug: inserted.slug,
        themeColor: inserted.theme_color,
      });
    }

    let productosCreados = 0;
    if (inserted?.id && productosSemilla.length) {
      const rows = productosSemilla.map((p, i) => ({
        business_profile_id: inserted.id,
        title: p.title,
        description: p.description || null,
        price: p.price,
        currency: 'PEN',
        images: p.images.map((url) => ({ url, alt: p.title })),
        status: typeof p.price === 'number' ? 'published' : 'draft',
        sort_order: i,
        import_source: 'adiso',
        ai_metadata: { source_adiso_id: adisoId },
      }));
      const { data: products, error: prodError } = await supabaseAdmin
        .from('catalog_products')
        .insert(rows)
        .select('id');
      if (prodError) {
        console.error('[from-adiso] products', prodError);
      } else {
        productosCreados = products?.length || 0;
      }
    }

    return NextResponse.json({
      success: true,
      profile: inserted,
      productosCreados,
      fromAdisoId: adisoId,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error';
    console.error('[from-adiso]', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
