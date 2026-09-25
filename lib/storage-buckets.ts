/**
 * Buckets en Supabase Storage.
 * El bucket de marca para fotos de adisos e historias es `adisos-images`.
 * `avisos-images` solo conserva archivos ya publicados; no se usa como nombre de producto.
 * Se puede sobreescribir con NEXT_PUBLIC_ADISO_IMAGES_BUCKET.
 */
export const ADISO_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_ADISO_IMAGES_BUCKET || 'adisos-images';

export const FEEDBACK_IMAGES_BUCKET = 'feedback-images';

/** KYC privado de motorizados (Envíos) */
export const MOTO_KYC_BUCKET = 'moto-kyc';

/** Fotos públicas opcionales de paquetes */
export const MOTO_PACKAGES_BUCKET = 'moto-packages';

/** Intenta el bucket de marca y, si falla, el almacén legado. */
export const ADISO_IMAGES_BUCKET_FALLBACKS = [
  ADISO_IMAGES_BUCKET,
  'adisos-images',
  'avisos-images',
].filter((name, index, arr) => arr.indexOf(name) === index);
