import { updateCatalogProduct } from '@/lib/business';

export async function reorderCatalogProducts(
  _businessProfileId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (orderedIds.length === 0) {
    return { success: false, error: 'Lista vacía' };
  }

  try {
    await Promise.all(
      orderedIds.map((id, index) => updateCatalogProduct(id, { sort_order: index }))
    );
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al guardar el orden';
    return { success: false, error: message };
  }
}
