import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyTemplate } from '@/lib/business/templates/apply-template';
import { sanitizeBusinessProfilePayload } from '@/lib/business';
import type { BusinessProfile, ProfileBlock } from '@/types/business';
import { DEFAULT_PROFILE_BLOCKS } from '@/lib/business/profile-blocks';

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  profile: z.record(z.unknown()),
});

type ToolResult = { patch: Partial<BusinessProfile>; reply: string };

function runTools(message: string, profile: Partial<BusinessProfile>): ToolResult {
  const lower = message.toLowerCase();
  const patch: Partial<BusinessProfile> = {};
  let reply = 'Actualicé tu perfil.';

  if (/(tagline|eslogan)/.test(lower)) {
    const match = message.match(/(?:a|como|que diga)\s+["']?([^"'.]+)["']?/i);
    patch.tagline = match?.[1]?.trim() || message.replace(/.*tagline\s*/i, '').trim();
    reply = `Tagline actualizado a: "${patch.tagline}"`;
  } else if (/(descripci[oó]n)/.test(lower)) {
    patch.description = message.replace(/.*descripci[oó]n\s*/i, '').trim();
    reply = 'Descripción actualizada.';
  } else if (/(anuncio|banner|announcement)/.test(lower)) {
    patch.announcement_text = message.replace(/.*(anuncio|banner)\s*/i, '').trim();
    patch.announcement_active = true;
    reply = 'Anuncio actualizado.';
  } else if (/(plantilla|template)\s*(bento|minimal|vibrant|modern|ferreter|restaur|belleza|servicio)/.test(lower)) {
    const idMap: Record<string, string> = {
      bento: 'bento_scroll',
      minimal: 'minimal_scroll',
      vibrant: 'vibrant_tabs',
      modern: 'modern_tabs',
      ferreter: 'pack_ferreteria',
      restaur: 'pack_restaurante',
      belleza: 'pack_belleza',
      servicio: 'pack_servicios',
    };
    const key = Object.keys(idMap).find((k) => lower.includes(k));
    if (key) {
      return { patch: applyTemplate(profile, { templateId: idMap[key], policy: 'merge' }), reply: `Plantilla ${idMap[key]} aplicada.` };
    }
  } else if (/(ocultar|esconder|hide)\s+(cat[aá]logo|deals|reseñas|reviews|mapa)/.test(lower)) {
    const typeMap: Record<string, ProfileBlock['type']> = {
      cat: 'catalog',
      deal: 'deals',
      rese: 'reviews',
      review: 'reviews',
      mapa: 'map',
    };
    const blocks = profile.profile_blocks?.length ? [...profile.profile_blocks] : [...DEFAULT_PROFILE_BLOCKS];
    const hit = Object.entries(typeMap).find(([k]) => lower.includes(k));
    if (hit) {
      const [, type] = hit;
      const next = blocks.map((b) => (b.type === type ? { ...b, visible: false } : b));
      patch.profile_blocks = next;
      reply = `Bloque ${type} oculto.`;
    }
  } else if (/(mostrar|activar)\s+(cat[aá]logo|deals|reseñas)/.test(lower)) {
    const blocks = profile.profile_blocks?.length ? [...profile.profile_blocks] : [...DEFAULT_PROFILE_BLOCKS];
    const type = lower.includes('deal') ? 'deals' : lower.includes('rese') ? 'reviews' : 'catalog';
    patch.profile_blocks = blocks.map((b) => (b.type === type ? { ...b, visible: true } : b));
    reply = `Bloque ${type} visible.`;
  } else if (/(tema|theme)\s*(ejecutivo|minimal|org[aá]nico|cyber)/.test(lower)) {
    const presets = { ejecutivo: 'executive', minimal: 'minimal', orgánico: 'organic', organico: 'organic', cyber: 'cyberpunk' } as const;
    const key = Object.keys(presets).find((k) => lower.includes(k)) as keyof typeof presets | undefined;
    if (key) {
      patch.theme_preset = presets[key];
      patch.theme_mode = presets[key] === 'cyberpunk' ? 'dark' : 'light';
      reply = `Tema ${presets[key]} aplicado.`;
    }
  } else if (/(nombre|name)/.test(lower)) {
    patch.name = message.replace(/.*(nombre|name)\s*(a|como)?\s*/i, '').trim();
    reply = `Nombre actualizado.`;
  } else {
    reply =
      'Puedo ayudarte con: tagline, descripción, anuncio, plantillas (bento, minimal, ferretería...), ocultar/mostrar bloques, o cambiar tema. ¿Qué necesitas?';
  }

  return { patch: sanitizeBusinessProfilePayload({ ...patch }) as Partial<BusinessProfile>, reply };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const body = bodySchema.parse(await req.json());
    const profile = body.profile as Partial<BusinessProfile>;
    if (profile.id && profile.id !== businessId) {
      return NextResponse.json({ error: 'ID no coincide' }, { status: 400 });
    }
    const result = runTools(body.message, profile);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[edit-chat]', e);
    return NextResponse.json({ error: 'Error en chat de edición' }, { status: 500 });
  }
}
