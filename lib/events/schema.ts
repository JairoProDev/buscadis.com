import { z } from 'zod';

export const BEHAVIORAL_EVENT_TYPES = [
  'session.start',
  'search.performed',
  'filter.applied',
  'filter.cleared',
  'category.selected',
  'ad.impression',
  'ad.click',
  'ad.view_start',
  'ad.view_end',
  'ad.favorite',
  'ad.dismiss',
  'ad.dismiss_reason',
  'ad.contact_whatsapp',
  'ad.contact_chat',
  'ad.contact_copy',
  'publish.step_view',
  'publish.draft_update',
  'publish.abandon',
  'seek.intent_saved',
  'promotion.purchased',
  'auth.sign_up',
  'deal.feed.open',
  'deal.clip.view',
  'deal.clip.like',
  'deal.clip.save',
  'deal.clip.share',
  'deal.clip.cta_click',
  'deal.clip.whatsapp_click',
  'deal.clip.not_interested',
  'deal.publish.start',
  'deal.publish.complete',
] as const;

export type BehavioralEventType = (typeof BEHAVIORAL_EVENT_TYPES)[number];

export const ENTITY_TYPES = [
  'adiso',
  'search',
  'filter',
  'category',
  'publish_draft',
  'session',
  'deal_clip',
  'promotion',
  'auth',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const behavioralEventSchema = z.object({
  eventType: z.enum(BEHAVIORAL_EVENT_TYPES),
  entityType: z.enum(ENTITY_TYPES).optional(),
  entityId: z.string().max(256).optional(),
  payload: z.record(z.unknown()).optional(),
  context: z.record(z.unknown()).optional(),
  scoreDelta: z.number().finite().optional(),
  sessionId: z.string().max(128).optional(),
  anonymousId: z.string().max(128).optional(),
  userId: z.string().uuid().optional().nullable(),
  clientTimestamp: z.string().optional(),
});

export const eventsBatchSchema = z.object({
  events: z.array(behavioralEventSchema).min(1).max(50),
});

export type BehavioralEventInput = z.infer<typeof behavioralEventSchema>;

/** Default score deltas for profile building */
export const EVENT_SCORE_DELTAS: Partial<Record<BehavioralEventType, number>> = {
  'search.performed': 1,
  'ad.click': 0.5,
  'ad.view_end': 0.3,
  'ad.favorite': 2,
  'ad.dismiss': -1.5,
  'ad.dismiss_reason': -2,
  'ad.contact_whatsapp': 3,
  'ad.contact_chat': 3.5,
  'seek.intent_saved': 2.5,
  'category.selected': 0.5,
  'filter.applied': 0.3,
};
