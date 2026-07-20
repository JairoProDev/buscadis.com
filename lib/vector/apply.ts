/**
 * Vector engine — apply.
 *
 * Writes a structured draft to the Buscadis target using a service-role client
 * (server-only). Profile fields go through the shared allow-list sanitizer so
 * all edit modes stay consistent; products and categories are inserted directly.
 */
import { sanitizeBusinessProfilePayload } from '@/lib/business';
import { categorySlug } from '@/lib/catalog/categories';
import { buscadisTarget } from './targets/buscadis-profile';
import type { ApplyInput, ApplyResult } from './types';

function resolveImageFactory(input: ApplyInput) {
  return (ref: number | string): string | undefined => {
    if (typeof ref === 'string') return ref;
    const artifact = input.artifacts[ref];
    return artifact?.mediaUrl;
  };
}

async function upsertCategories(
  input: ApplyInput,
  names: string[]
): Promise<string[]> {
  const { admin, businessProfileId } = input;
  if (!names.length) return [];

  const { data: existing } = await admin
    .from('business_categories')
    .select('slug')
    .eq('business_profile_id', businessProfileId);
  const existingSlugs = new Set((existing || []).map((c: { slug: string }) => c.slug));

  const created: string[] = [];
  let order = existingSlugs.size;
  for (const name of names) {
    const clean = name.trim();
    if (!clean) continue;
    const slug = categorySlug(clean);
    if (existingSlugs.has(slug)) continue;
    const { error } = await admin.from('business_categories').insert({
      business_profile_id: businessProfileId,
      name: clean,
      slug,
      sort_order: order++,
    });
    if (!error) {
      existingSlugs.add(slug);
      created.push(clean);
    }
  }
  return created;
}

export async function applyDraft(input: ApplyInput): Promise<ApplyResult> {
  const { admin, businessProfileId, userId, draft, currentProfile } = input;

  // 1) Profile patch (safe merge) -> sanitize -> persist.
  const { patch, skipped } = buscadisTarget.toProfilePatch(
    draft.profile,
    currentProfile,
    draft.confidence
  );

  let appliedProfilePatch = patch;
  if (Object.keys(patch).length > 0) {
    const safe = sanitizeBusinessProfilePayload(patch as Record<string, unknown>);
    const { data: updated, error } = await admin
      .from('business_profiles')
      .update({ ...safe, updated_at: new Date().toISOString() })
      .eq('id', businessProfileId)
      .select()
      .single();
    if (error) {
      console.error('applyDraft profile update error:', error.message);
    } else if (updated) {
      appliedProfilePatch = safe as ApplyResult['appliedProfilePatch'];
    }
  }

  // 2) Categories (draft names + any category referenced by products).
  const categoryNames = new Set<string>([
    ...(draft.profile.categories || []),
    ...draft.products.map((p) => p.category).filter((c): c is string => Boolean(c)),
  ]);
  const createdCategories = await upsertCategories(input, Array.from(categoryNames));

  // 3) Products.
  const createdProductIds: string[] = [];
  if (draft.products.length > 0) {
    const rows = buscadisTarget.toProductRows(
      draft.products,
      businessProfileId,
      userId,
      resolveImageFactory(input)
    );
    const { data: inserted, error } = await admin
      .from('catalog_products')
      .insert(rows)
      .select('id');
    if (error) {
      console.error('applyDraft product insert error:', error.message);
    } else if (inserted) {
      createdProductIds.push(...inserted.map((r: { id: string }) => r.id));
    }
  }

  return {
    appliedProfilePatch,
    skippedFields: skipped,
    createdProductIds,
    createdCategories,
  };
}
