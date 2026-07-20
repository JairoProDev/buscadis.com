/**
 * Vector engine — shared types.
 *
 * The engine is a reusable "machine": raw multimodal input enters via `ingest`,
 * gets `structure`d into a schema-shaped draft, then `apply`ed to a target.
 * Only the Buscadis profile target is implemented today; Publicadis/Vectorify
 * can add their own target adapters later.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessProfile } from '@/types/business';
import type { BusinessProfileDraft, CatalogProductDraft, VectorDraft } from './schema';

export type IngestKind = 'text' | 'audio' | 'image' | 'pdf' | 'doc' | 'link';

/** A single raw input from the user, before understanding. */
export interface IngestSource {
  kind: IngestKind;
  /** For text/link. */
  text?: string;
  /** For link (URL to fetch) or already-hosted media. */
  url?: string;
  /** For uploaded media (base64, no data: prefix). */
  dataBase64?: string;
  mimeType?: string;
  filename?: string;
  /** Public URL if the media was uploaded to storage (for persistence/preview). */
  storedUrl?: string;
}

/** A normalized, understood piece of content derived from a source. */
export interface Artifact {
  id: string;
  kind: IngestKind;
  label: string;
  /** Human-readable extracted content used as LLM context. */
  rawText: string;
  /** Optional structured payload (e.g. products detected in an image). */
  extractedJson?: unknown;
  /** Public media URL, when applicable (image/logo/banner candidates). */
  mediaUrl?: string;
  mimeType?: string;
}

export interface StructureInput {
  artifacts: Artifact[];
  currentProfile: Partial<BusinessProfile>;
  currentProducts?: Array<{ title?: string; category?: string }>;
  /** Free-form instruction typed by the user this turn. */
  userMessage?: string;
}

export interface ApplyInput {
  admin: SupabaseClient;
  businessProfileId: string;
  userId: string;
  draft: VectorDraft;
  currentProfile: Partial<BusinessProfile>;
  artifacts: Artifact[];
}

export interface ApplyResult {
  appliedProfilePatch: Partial<BusinessProfile>;
  skippedFields: string[];
  createdProductIds: string[];
  createdCategories: string[];
}

/** Adapter that maps a generic draft onto a concrete platform target. */
export interface TargetAdapter {
  toProfilePatch(
    profileDraft: BusinessProfileDraft,
    current: Partial<BusinessProfile>,
    confidence: Record<string, number>
  ): { patch: Partial<BusinessProfile>; skipped: string[] };
  toProductRows(
    products: CatalogProductDraft[],
    businessProfileId: string,
    userId: string,
    resolveImage: (ref: number | string) => string | undefined
  ): Record<string, unknown>[];
}
