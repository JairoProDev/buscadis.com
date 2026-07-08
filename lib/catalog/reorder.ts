export async function reorderCatalogProducts(
  businessProfileId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/catalog/products/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_profile_id: businessProfileId, orderedIds }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Error al reordenar' };
    }
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error de red';
    return { success: false, error: message };
  }
}
