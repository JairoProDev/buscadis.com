/**
 * POST /api/resena/[token] — envío anónimo con contacto verificado.
 * GET — metadatos del invite (nombre negocio) para la UI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verificarTokenResenaInvite } from '@/lib/business/review-invite-token';

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(400).optional(),
  customerName: z.string().max(40).optional(),
});

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token: raw } = await ctx.params;
  const token = decodeURIComponent(raw);
  const invite = verificarTokenResenaInvite(token);
  if (!invite) {
    return NextResponse.json({ error: 'Enlace inválido o vencido' }, { status: 400 });
  }
  return NextResponse.json({
    slug: invite.slug,
    nombre: invite.nombre,
    expiresAt: new Date(invite.exp).toISOString(),
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token: raw } = await ctx.params;
  const token = decodeURIComponent(raw);
  const invite = verificarTokenResenaInvite(token);
  if (!invite) {
    return NextResponse.json({ error: 'Enlace inválido o vencido' }, { status: 400 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Elige de 1 a 5 estrellas' }, { status: 400 });
  }

  const name = (parsed.data.customerName || 'Cliente').trim().slice(0, 40) || 'Cliente';
  const text = parsed.data.text?.trim() || null;

  // Inserta sin exigir login; contacto verificado por token de invite
  const row: Record<string, unknown> = {
    business_profile_id: invite.negocioId,
    rating: parsed.data.rating,
    text,
    comment: text,
    customer_name: name,
    is_verified: true,
    verified_purchase: true,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('business_reviews')
    .insert(row)
    .select('id, rating')
    .single();

  if (error) {
    console.error('[resena-invite]', error.message);
    // Fallback si columnas verified no existen
    if (error.message.includes('column') || error.code === '42703') {
      const { data: d2, error: e2 } = await supabaseAdmin
        .from('business_reviews')
        .insert({
          business_profile_id: invite.negocioId,
          rating: parsed.data.rating,
          text,
          comment: text,
          customer_name: name,
          is_visible: true,
        })
        .select('id, rating')
        .single();
      if (e2) {
        return NextResponse.json({ error: e2.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, review: d2, slug: invite.slug });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, review: data, slug: invite.slug });
}
