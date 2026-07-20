/**
 * Vector engine — canonical draft schemas.
 *
 * The LLM returns plain values (far more reliable than nested {value,confidence}
 * per field) plus parallel `confidence` / `provenance` maps keyed by field name.
 * This keeps the "each field carries confidence + provenance" contract while
 * staying robust to validate in TypeScript.
 */
import { z } from 'zod';

export const SocialLinkDraftSchema = z.object({
  network: z
    .enum(['facebook', 'instagram', 'tiktok', 'twitter', 'linkedin', 'custom'])
    .default('custom'),
  url: z.string().min(1),
  label: z.string().optional(),
});

export const DayHoursDraftSchema = z.object({
  open: z.string().default('09:00'),
  close: z.string().default('18:00'),
  closed: z.boolean().default(false),
});

export const BusinessProfileDraftSchema = z
  .object({
    name: z.string().optional(),
    /** Suggested handle/slug (normalized later). */
    slug: z.string().optional(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    contact_whatsapp: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_email: z.string().optional(),
    contact_address: z.string().optional(),
    contact_maps_url: z.string().optional(),
    theme_color: z.string().optional(),
    social_links: z.array(SocialLinkDraftSchema).optional(),
    business_hours: z.record(DayHoursDraftSchema).optional(),
    profile_hashtags: z.array(z.string()).optional(),
    /** Suggested catalog categories (names). */
    categories: z.array(z.string()).optional(),
  })
  .partial();

export const CatalogProductDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().default('PEN'),
  category: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.any()).optional(),
  /** Indices into the ingested image artifacts, or direct image URLs. */
  imageRefs: z.array(z.union([z.number(), z.string()])).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const FollowUpQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  /** Profile field this question would fill, if answered. */
  field: z.string().optional(),
});

/**
 * The full object the LLM must return each turn.
 */
export const VectorDraftSchema = z.object({
  /** Conversational reply shown to the user (warm, human, in Spanish). */
  reply: z.string().default(''),
  profile: BusinessProfileDraftSchema.default({}),
  products: z.array(CatalogProductDraftSchema).default([]),
  /** Field names still missing / worth asking about. */
  missingFields: z.array(z.string()).default([]),
  followUpQuestions: z.array(FollowUpQuestionSchema).default([]),
  /** Per-field confidence 0..1, keyed by profile field name. */
  confidence: z.record(z.number().min(0).max(1)).default({}),
  /** Per-field provenance (which source it came from), keyed by field name. */
  provenance: z.record(z.string()).default({}),
});

export type SocialLinkDraft = z.infer<typeof SocialLinkDraftSchema>;
export type BusinessProfileDraft = z.infer<typeof BusinessProfileDraftSchema>;
export type CatalogProductDraft = z.infer<typeof CatalogProductDraftSchema>;
export type FollowUpQuestion = z.infer<typeof FollowUpQuestionSchema>;
export type VectorDraft = z.infer<typeof VectorDraftSchema>;
