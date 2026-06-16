import { supabaseAdmin } from '@/lib/supabase-admin';

export async function logDealBehavioralEvent(params: {
  userId?: string;
  sessionId?: string;
  eventType: string;
  clipId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabaseAdmin.from('behavioral_events').insert({
      user_id: params.userId || null,
      session_id: params.sessionId || null,
      event_type: params.eventType,
      entity_type: 'deal_clip',
      entity_id: params.clipId,
      metadata: params.metadata || {},
    });
  } catch (e) {
    console.warn('[deals/analytics] behavioral event failed', e);
  }
}

export const DEAL_EVENTS = {
  FEED_OPEN: 'deal.feed.open',
  CLIP_VIEW: 'deal.clip.view',
  CLIP_LIKE: 'deal.clip.like',
  CLIP_SAVE: 'deal.clip.save',
  CLIP_SHARE: 'deal.clip.share',
  CTA_CLICK: 'deal.clip.cta_click',
  WHATSAPP_CLICK: 'deal.clip.whatsapp_click',
  NOT_INTERESTED: 'deal.clip.not_interested',
  PUBLISH_START: 'deal.publish.start',
  PUBLISH_COMPLETE: 'deal.publish.complete',
} as const;
