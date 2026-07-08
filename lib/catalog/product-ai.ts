import { supabase } from '@/lib/supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export type ProductAiAnalysis = {
  title?: string;
  description?: string;
  price?: number | null;
  category?: string;
  brand?: string;
  tags?: string[];
};

export async function analyzeProductFromImage(imageUrl: string): Promise<ProductAiAnalysis> {
  const auth = await getAuthHeaders();
  const res = await fetch('/api/analyze-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ imageUrl }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Error al analizar la imagen');
  }
  return json.data || json;
}

export async function enhanceProductFieldFromImage(
  imageUrl: string,
  field: 'title' | 'description'
): Promise<string | null> {
  const auth = await getAuthHeaders();
  const res = await fetch('/api/catalog/enhance-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ imageUrl, actions: ['analyze'] }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Error al mejorar con IA');
  }
  const analysis = json.analysis;
  if (field === 'title' && analysis?.title) return analysis.title;
  if (field === 'description' && analysis?.description) return analysis.description;
  return null;
}
