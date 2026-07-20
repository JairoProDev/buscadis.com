/**
 * Vector engine — Buscadis profile target adapter.
 *
 * Maps a generic draft onto the Buscadis `business_profiles` + `catalog_products`
 * shape, enforcing the safe merge policy (fill empty fields; never clobber
 * existing user data silently).
 */
import type { BusinessProfile, SocialLink } from '@/types/business';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import type { TargetAdapter } from '../types';
import type { CatalogProductDraft } from '../schema';

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

/** Fields the AI may fill on a profile, in the order we present them. */
const FILLABLE_TEXT_FIELDS: Array<keyof BusinessProfile> = [
  'name',
  'tagline',
  'description',
  'contact_whatsapp',
  'contact_phone',
  'contact_email',
  'contact_address',
  'contact_maps_url',
  'theme_color',
];

export const buscadisTarget: TargetAdapter = {
  toProfilePatch(profileDraft, current, _confidence) {
    const patch: Partial<BusinessProfile> = {};
    const skipped: string[] = [];

    for (const field of FILLABLE_TEXT_FIELDS) {
      const draftVal = (profileDraft as Record<string, unknown>)[field];
      if (isEmpty(draftVal)) continue;
      if (isEmpty(current[field])) {
        (patch as Record<string, unknown>)[field] = draftVal;
      } else {
        skipped.push(field);
      }
    }

    // Slug only when there isn't one yet (changing it breaks the public URL).
    if (!isEmpty(profileDraft.slug) && isEmpty(current.slug)) {
      patch.slug = normalizeBusinessSlug(String(profileDraft.slug))
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else if (!isEmpty(profileDraft.slug)) {
      skipped.push('slug');
    }

    // Social links: union by url (don't drop existing ones).
    if (profileDraft.social_links?.length) {
      const existing = (current.social_links || []) as SocialLink[];
      const byUrl = new Map(existing.map((l) => [l.url, l]));
      for (const link of profileDraft.social_links) {
        if (link.url && !byUrl.has(link.url)) {
          byUrl.set(link.url, {
            network: link.network,
            url: link.url,
            label: link.label,
          } as SocialLink);
        }
      }
      patch.social_links = Array.from(byUrl.values());
    }

    // Business hours: only when none set.
    if (profileDraft.business_hours && isEmpty(current.business_hours)) {
      patch.business_hours = profileDraft.business_hours as BusinessProfile['business_hours'];
    } else if (profileDraft.business_hours) {
      skipped.push('business_hours');
    }

    // Hashtags: union.
    if (profileDraft.profile_hashtags?.length) {
      const merged = new Set([...(current.profile_hashtags || []), ...profileDraft.profile_hashtags]);
      patch.profile_hashtags = Array.from(merged);
    }

    return { patch, skipped };
  },

  toProductRows(products, businessProfileId, _userId, resolveImage) {
    return products.map((p: CatalogProductDraft, index) => {
      const images = (p.imageRefs || [])
        .map((ref, i) => {
          const url = resolveImage(ref);
          return url ? { url, is_primary: i === 0, alt_text: p.title } : null;
        })
        .filter(Boolean);

      const attributes: Record<string, unknown> = { ...(p.attributes || {}) };
      if (p.brand) attributes.brand = p.brand;

      return {
        business_profile_id: businessProfileId,
        title: p.title,
        description: p.description || null,
        sku: p.sku || null,
        price: typeof p.price === 'number' ? p.price : null,
        currency: p.currency || 'PEN',
        category: p.category || null,
        tags: p.tags || [],
        attributes,
        images,
        status: 'draft',
        is_featured: false,
        sort_order: index,
        ai_metadata: {
          extracted_from: 'vector',
          confidence_score: p.confidence ?? null,
          seeded_at: new Date().toISOString(),
        },
      };
    });
  },
};
