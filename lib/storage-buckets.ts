/**
 * Buckets en Supabase Storage.
 * En producción el bucket público de anuncios e historias es `avisos-images`.
 * `adisos-images` queda como alias por si el entorno aún apunta al nombre viejo.
 * Se puede sobreescribir con NEXT_PUBLIC_ADISO_IMAGES_BUCKET.
 */
export const ADISO_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_ADISO_IMAGES_BUCKET || 'avisos-images';

export const FEEDBACK_IMAGES_BUCKET = 'feedback-images';

/** KYC privado de motorizados (Envíos) */
export const MOTO_KYC_BUCKET = 'moto-kyc';

/** Fotos públicas opcionales de paquetes */
export const MOTO_PACKAGES_BUCKET = 'moto-packages';

/** Intenta el bucket configurado, el real de producción y el alias. */
export const ADISO_IMAGES_BUCKET_FALLBACKS = [
  ADISO_IMAGES_BUCKET,
  'avisos-images',
  'adisos-images',
].filter((name, index, arr) => arr.indexOf(name) === index);
