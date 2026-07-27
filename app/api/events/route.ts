import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { eventsBatchSchema } from '@/lib/events/schema';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

const MAX_BODY_BYTES = 64_000;

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const limited = rateLimit(`events-${ip}`, { windowMs: 60_000, maxRequests: 120 });
  if (!limited.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = eventsBatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid events', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent')?.slice(0, 512) ?? null;
    const rows = parsed.data.events.map((ev) => ({
      user_id: ev.userId || null,
      session_id: ev.sessionId || null,
      anonymous_id: ev.anonymousId || null,
      event_type: ev.eventType,
      entity_type: ev.entityType || null,
      entity_id: ev.entityId || null,
      payload: {
        ...(ev.payload || {}),
        client_timestamp: ev.clientTimestamp,
      },
      context: {
        ...(ev.context || {}),
        user_agent: userAgent,
        client_ip: ip !== 'unknown' ? ip : undefined,
      },
      score_delta: ev.scoreDelta ?? 0,
    }));

    const { error } = await supabaseAdmin.from('behavioral_events').insert(rows);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('behavioral_events')) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      console.error('[events] insert error:', error.message);
      return NextResponse.json({ error: 'Storage failed' }, { status: 500 });
    }

    // Near-real-time profile bump for high-signal events (cron still handles decay)
    const HIGH = new Set([
      'ad.favorite',
      'ad.dismiss',
      'ad.dismiss_reason',
      'ad.contact_whatsapp',
      'ad.contact_chat',
      'ad.contact_copy',
      'deal.clip.like',
      'deal.clip.save',
      'deal.clip.not_interested',
      'deal.clip.whatsapp_click',
    ]);
    const toRebuild = [
      ...new Set(
        rows
          .filter((r) => r.user_id && HIGH.has(r.event_type))
          .map((r) => r.user_id as string)
      ),
    ].slice(0, 5);

    if (toRebuild.length > 0) {
      void import('@/lib/behavior/rebuild-profiles').then(({ rebuildUserBehaviorProfile }) => {
        for (const uid of toRebuild) {
          void rebuildUserBehaviorProfile(uid).catch((e) =>
            console.warn('[events] incremental rebuild', uid, e)
          );
        }
      });
    }

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    console.error('[events]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
