/**
 * POST /api/business/ai-builder
 *
 * The AI profile builder turn. Accepts multipart/form-data:
 *   - message   (string, optional)   free-form text from the user
 *   - businessId(string, optional)   existing profile to edit; created if absent
 *   - sessionId (string, optional)   chat session id
 *   - links     (string, optional)   JSON array or newline/comma separated URLs
 *   - files     (File[], optional)   images / audio / pdf / docs
 *
 * Runs the Vector engine (ingest -> structure -> apply) using a service-role
 * client after verifying the caller owns (or can manage) the business.
 * Returns the applied patch, created products, missing fields and follow-ups.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sanitizeBusinessProfilePayload } from '@/lib/business';
import { isPlatformAdminEmail, isPlatformAdminProfile } from '@/lib/platform-admin';
import { ensureQrCodeForBusiness } from '@/lib/qr/service';
import { revalidateTag } from 'next/cache';
import { BUSINESS_CACHE_TAG } from '@/lib/business/seo';
import { isGeminiConfigured } from '@/lib/ai/gemini';
import {
  ingestSources,
  structureArtifacts,
  applyDraft,
  persistArtifacts,
  type IngestSource,
  type IngestKind,
} from '@/lib/vector';
import { reserveAIBudget, estimateChatTurnCost } from '@/lib/ai/cost-governance';
import { trackAIEvent } from '@/lib/ai/observability';
import { getOrCreateSession, appendTurn } from '@/lib/ai/session-store';

export const runtime = 'nodejs';
export const maxDuration = 120;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const MAX_FILES = 12;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

function kindForMime(mime: string): IngestKind {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  return 'doc';
}

async function verifyCanManage(userId: string, email: string | undefined, businessId: string): Promise<boolean> {
  const { data: profile } = await supabaseAdmin
    .from('business_profiles')
    .select('id, user_id')
    .eq('id', businessId)
    .single();
  if (!profile) return false;
  if (profile.user_id === userId) return true;
  if (!profile.user_id) {
    await supabaseAdmin.from('business_profiles').update({ user_id: userId }).eq('id', businessId);
    return true;
  }
  const { data: membership } = await supabaseAdmin
    .from('business_members')
    .select('role')
    .eq('business_profile_id', businessId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (membership?.role && ['owner', 'admin', 'editor'].includes(membership.role)) return true;
  if (isPlatformAdminEmail(email)) return true;
  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('rol, is_platform_admin')
    .eq('id', userId)
    .maybeSingle();
  return isPlatformAdminProfile(adminProfile);
}

/** Public URL for a product image (uploaded to the public catalog bucket). */
async function uploadPublicImage(
  admin: SupabaseClient,
  userId: string,
  buffer: Buffer,
  mime: string,
  filename?: string
): Promise<string | null> {
  try {
    const ext = filename?.split('.').pop() || mime.split('/')[1] || 'jpg';
    const path = `${userId}/products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await admin.storage.from('catalog-images').upload(path, buffer, {
      contentType: mime,
      upsert: false,
    });
    if (error) {
      console.error('uploadPublicImage error:', error.message);
      return null;
    }
    return admin.storage.from('catalog-images').getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.error('uploadPublicImage exception:', (e as Error).message);
    return null;
  }
}

function parseLinks(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* not JSON */
  }
  return raw
    .split(/[\n,\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    // 1) Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: 'El asistente de IA no está configurado (falta GEMINI_API_KEY).' },
        { status: 503 }
      );
    }

    // 2) Parse multipart form
    const form = await req.formData();
    const message = (form.get('message') as string | null)?.trim() || '';
    let businessId = (form.get('businessId') as string | null) || '';
    const sessionId = (form.get('sessionId') as string | null) || undefined;
    const links = parseLinks(form.get('links') as string | null);
    const files = form.getAll('files').filter((f): f is File => f instanceof File).slice(0, MAX_FILES);

    if (!message && links.length === 0 && files.length === 0) {
      return NextResponse.json({ error: 'Envía un mensaje, un archivo o un enlace.' }, { status: 400 });
    }

    // 3) Cost guard
    const estimate = estimateChatTurnCost(message + links.join(' '), '') + files.length * 0.01;
    if (!reserveAIBudget(estimate)) {
      return NextResponse.json(
        { error: 'Alcanzamos el límite diario de IA. Intenta más tarde.' },
        { status: 429 }
      );
    }

    // 4) Draft-first: ensure a profile row exists so all edit modes share state.
    let createdBusiness = false;
    if (!businessId) {
      // sanitize strips user_id/created_by; set ownership after (see publish route).
      const safePayload = sanitizeBusinessProfilePayload({
        name: 'Mi negocio',
        is_published: false,
      }) as Record<string, unknown>;
      safePayload.user_id = user.id;
      safePayload.created_by = user.id;
      const { data: created, error: createError } = await supabaseAdmin
        .from('business_profiles')
        .insert([safePayload])
        .select()
        .single();
      if (createError || !created) {
        return NextResponse.json({ error: createError?.message || 'No se pudo crear el perfil' }, { status: 500 });
      }
      businessId = created.id;
      createdBusiness = true;
      await supabaseAdmin.from('business_members').upsert(
        {
          business_profile_id: businessId,
          user_id: user.id,
          role: 'owner',
          status: 'active',
          invited_by: user.id,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: 'business_profile_id,user_id' }
      );
    } else {
      const allowed = await verifyCanManage(user.id, user.email, businessId);
      if (!allowed) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
    }

    // 5) Build ingest sources (text + links + files). Images also uploaded public.
    const sources: IngestSource[] = [];
    if (message) sources.push({ kind: 'text', text: message });
    for (const url of links) sources.push({ kind: 'link', url });

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) continue;
      const mime = file.type || 'application/octet-stream';
      const kind = kindForMime(mime);
      const buffer = Buffer.from(await file.arrayBuffer());
      const dataBase64 = buffer.toString('base64');
      let storedUrl: string | undefined;
      if (kind === 'image') {
        storedUrl = (await uploadPublicImage(supabaseAdmin, user.id, buffer, mime, file.name)) || undefined;
      }
      sources.push({ kind, dataBase64, mimeType: mime, filename: file.name, storedUrl });
    }

    // 6) Ingest -> artifacts, persist as "second brain".
    const artifacts = await ingestSources(sources);
    await persistArtifacts(supabaseAdmin, businessId, sessionId || null, artifacts);

    // 7) Load latest profile + products as context (DB is the source of truth).
    const { data: currentProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('id', businessId)
      .single();
    const { data: currentProducts } = await supabaseAdmin
      .from('catalog_products')
      .select('title, category')
      .eq('business_profile_id', businessId)
      .limit(200);

    // 8) Structure -> draft.
    const draft = await structureArtifacts({
      artifacts,
      currentProfile: currentProfile || {},
      currentProducts: currentProducts || [],
      userMessage: message,
    });

    // 9) Apply -> writes.
    const applied = await applyDraft({
      admin: supabaseAdmin,
      businessProfileId: businessId,
      userId: user.id,
      draft,
      currentProfile: currentProfile || {},
      artifacts,
    });

    // Return the freshest profile so the client can sync all modes.
    const { data: freshProfile } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('id', businessId)
      .single();

    if (freshProfile?.slug) {
      revalidateTag(BUSINESS_CACHE_TAG(freshProfile.slug));
      await ensureQrCodeForBusiness({
        businessProfileId: freshProfile.id,
        slug: freshProfile.slug,
        themeColor: freshProfile.theme_color,
      }).catch(() => {});
    }

    if (sessionId) {
      const session = getOrCreateSession(sessionId);
      if (message) appendTurn(session.sessionId, 'user', message);
      appendTurn(session.sessionId, 'assistant', draft.reply);
    }

    trackAIEvent({
      name: 'builder.response.sent',
      sessionId,
      userId: user.id,
      route: '/api/business/ai-builder',
      latencyMs: Date.now() - startedAt,
      status: 'ok',
      metadata: {
        createdBusiness,
        products: applied.createdProductIds.length,
        categories: applied.createdCategories.length,
      },
    });

    return NextResponse.json({
      success: true,
      businessId,
      createdBusiness,
      reply: draft.reply,
      appliedPatch: applied.appliedProfilePatch,
      appliedFields: Object.keys(applied.appliedProfilePatch),
      skippedFields: applied.skippedFields,
      createdProducts: applied.createdProductIds.length,
      createdCategories: applied.createdCategories,
      missingFields: draft.missingFields,
      followUpQuestions: draft.followUpQuestions,
      profile: freshProfile,
      slug: freshProfile?.slug || null,
    });
  } catch (err) {
    trackAIEvent({
      name: 'builder.error',
      route: '/api/business/ai-builder',
      level: 'error',
      status: 'error',
      latencyMs: Date.now() - startedAt,
      metadata: { message: (err as Error).message },
    });
    console.error('[ai-builder]', err);
    return NextResponse.json({ error: (err as Error).message || 'Error interno' }, { status: 500 });
  }
}
