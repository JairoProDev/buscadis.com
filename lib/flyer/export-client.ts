'use client';

/**
 * Export a flyer DOM node to JPEG and upload via existing image API.
 * Uses native canvas draw from SVG/HTML via html-to-image if available,
 * with a canvas fallback from foreign serialization.
 */

const EXPORT_SIZE = 1080;

export async function exportFlyerToBlob(node: HTMLElement): Promise<Blob | null> {
  try {
    const { toJpeg } = await import('html-to-image');
    const dataUrl = await toJpeg(node, {
      quality: 0.92,
      pixelRatio: EXPORT_SIZE / Math.max(node.offsetWidth || 1, 1),
      cacheBust: true,
      backgroundColor: '#ffffff',
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (e) {
    console.error('[flyer export]', e);
    return null;
  }
}

export async function uploadFlyerBlob(blob: Blob): Promise<string | null> {
  try {
    const file = new File([blob], `flyer-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const form = new FormData();
    form.append('image', file);
    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'x-upload-type': 'adisos' },
      body: form,
    });
    if (!res.ok) {
      console.error('[flyer upload]', await res.text());
      return null;
    }
    const data = (await res.json()) as { url?: string };
    return data.url || null;
  } catch (e) {
    console.error('[flyer upload]', e);
    return null;
  }
}

export async function exportAndUploadFlyer(node: HTMLElement | null): Promise<string | null> {
  if (!node) return null;
  const blob = await exportFlyerToBlob(node);
  if (!blob) return null;
  return uploadFlyerBlob(blob);
}
