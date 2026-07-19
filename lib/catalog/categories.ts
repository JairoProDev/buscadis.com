import { supabase } from '@/lib/supabase';

export interface BusinessCategory {
  id: string;
  business_profile_id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

const TABLE = 'business_categories';

export function categorySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'categoria';
}

export async function listBusinessCategories(
  businessProfileId: string
): Promise<BusinessCategory[]> {
  if (!supabase || !businessProfileId) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('listBusinessCategories error:', error);
    return [];
  }
  return (data as BusinessCategory[]) || [];
}

export async function createBusinessCategory(
  businessProfileId: string,
  input: { name: string; imageUrl?: string | null; sortOrder?: number }
): Promise<BusinessCategory | null> {
  if (!supabase) return null;
  const name = input.name.trim();
  if (!name) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      business_profile_id: businessProfileId,
      name,
      slug: categorySlug(name),
      image_url: input.imageUrl || null,
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();
  if (error) {
    console.error('createBusinessCategory error:', error);
    return null;
  }
  return data as BusinessCategory;
}

export async function updateBusinessCategory(
  category: Pick<BusinessCategory, 'id' | 'business_profile_id' | 'name'>,
  patch: { name?: string; imageUrl?: string | null }
): Promise<BusinessCategory | null> {
  if (!supabase) return null;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const newName = patch.name?.trim();
  const renaming = Boolean(newName && newName !== category.name);

  if (newName !== undefined) {
    updates.name = newName;
    updates.slug = categorySlug(newName || category.name);
  }
  if (patch.imageUrl !== undefined) {
    updates.image_url = patch.imageUrl || null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', category.id)
    .select()
    .single();
  if (error) {
    console.error('updateBusinessCategory error:', error);
    return null;
  }

  // Keep products in sync when the display name changes (products link by name).
  if (renaming && newName) {
    const { error: prodError } = await supabase
      .from('catalog_products')
      .update({ category: newName })
      .eq('business_profile_id', category.business_profile_id)
      .eq('category', category.name);
    if (prodError) console.error('rename category products error:', prodError);
  }

  return data as BusinessCategory;
}

export async function deleteBusinessCategory(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) {
    console.error('deleteBusinessCategory error:', error);
    return false;
  }
  return true;
}

export async function reorderBusinessCategories(orderedIds: string[]): Promise<boolean> {
  if (!supabase || orderedIds.length === 0) return false;
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase!.from(TABLE).update({ sort_order: index }).eq('id', id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error('reorderBusinessCategories error:', failed.error);
    return false;
  }
  return true;
}
