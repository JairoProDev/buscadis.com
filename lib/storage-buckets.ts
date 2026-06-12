/**
 * Buckets en Supabase Storage.
 * El bucket de anuncios en producción se llama `avisos-images` (legacy).
 * Se puede sobreescribir con NEXT_PUBLIC_ADISO_IMAGES_BUCKET.
 */
export const ADISO_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_ADISO_IMAGES_BUCKET || 'avisos-images';

export const FEEDBACK_IMAGES_BUCKET = 'feedback-images';

/** Intenta el bucket configurado y, si no existe, el alias histórico. */
export const ADISO_IMAGES_BUCKET_FALLBACKS = [
  ADISO_IMAGES_BUCKET,
  'avisos-images',
  'adisos-images',
].filter((name, index, arr) => arr.indexOf(name) === index);
