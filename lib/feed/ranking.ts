import { Adiso, TamañoPaquete } from '@/types';
import { adisoTieneImagen } from '@/lib/adiso-display';
import { personalizationFreshnessBoostMs } from '@/lib/ai/personalization';
import type { UserInterestProfile } from '@/lib/interactions';

const PACKAGE_RANK: Record<TamañoPaquete, number> = {
  miniatura: 0,
  pequeño: 1,
  mediano: 2,
  grande: 3,
  gigante: 4,
};

/** Aviso de catálogo de negocio (marketplace desde perfil comercial). */
export function isCatalogProduct(adiso: Adiso): boolean {
  return adiso.privateData?.source === 'catalog_product';
}

export function getPackageRank(tamaño: TamañoPaquete | undefined): number {
  if (!tamaño) return PACKAGE_RANK.miniatura;
  return PACKAGE_RANK[tamaño] ?? PACKAGE_RANK.miniatura;
}

function parsePublishedTimestamp(adiso: Adiso): number {
  if (!adiso.fechaPublicacion) return 0;
  try {
    let hora = adiso.horaPublicacion || '00:00';
    if (hora.length === 4) hora = `${hora.substring(0, 2)}:${hora.substring(2)}`;
    else if (hora.length !== 5) hora = '00:00';
    const date = new Date(`${adiso.fechaPublicacion}T${hora}:00`);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
}

/**
 * Adelanto temporal por calidad visual del aviso.
 * No supera la recencia de publicaciones muy nuevas sin imagen,
 * pero empuja avisos con foto por encima de texto plano del mismo tier.
 */
const IMAGE_BOOST_MS = 2 * 24 * 60 * 60 * 1000; // 2 días
const CATALOG_EXTRA_BOOST_MS = 1 * 24 * 60 * 60 * 1000; // +1 día catálogo
const MULTI_IMAGE_BOOST_MS = 12 * 60 * 60 * 1000; // +12 h si hay varias fotos

export function getFeedVisualBoostMs(adiso: Adiso): number {
  let boost = 0;

  if (adisoTieneImagen(adiso)) {
    boost += IMAGE_BOOST_MS;
    const imageCount = adiso.imagenesUrls?.filter((u) => u?.trim()).length
      ?? (adiso.imagenUrl?.trim() ? 1 : 0);
    if (imageCount > 1) boost += MULTI_IMAGE_BOOST_MS;
  }

  if (isCatalogProduct(adiso)) {
    boost += CATALOG_EXTRA_BOOST_MS;
  }

  return boost;
}

/**
 * Timestamp efectivo para ordenar "Más recientes":
 * fecha real + personalización + prioridad por imagen/catálogo.
 */
export function getFeedEffectiveTimestamp(
  adiso: Adiso,
  interestProfile?: UserInterestProfile | null,
): number {
  return parsePublishedTimestamp(adiso)
    + personalizationFreshnessBoostMs(adiso, interestProfile)
    + getFeedVisualBoostMs(adiso);
}

/**
 * Comparador del feed por defecto ("recientes"):
 * 1. Promoción pagada (premium/destacada)
 * 2. Recencia efectiva (con boost por imagen y catálogo)
 * 3. Tamaño de paquete legacy (miniatura → gigante)
 * 4. id estable
 */
export function compareRecientesFeed(
  a: Adiso,
  b: Adiso,
  interestProfile?: UserInterestProfile | null,
): number {
  const ra = a.promotionRank ?? 0;
  const rb = b.promotionRank ?? 0;
  if (ra !== rb) return rb - ra;

  const fa = getFeedEffectiveTimestamp(a, interestProfile);
  const fb = getFeedEffectiveTimestamp(b, interestProfile);
  const dateCmp = fb - fa;
  if (dateCmp !== 0) return dateCmp;

  const pa = getPackageRank(a.tamaño);
  const pb = getPackageRank(b.tamaño);
  if (pa !== pb) return pb - pa;

  return a.id.localeCompare(b.id);
}
