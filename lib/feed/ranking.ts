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
    const raw = String(adiso.fechaPublicacion).trim();
    // ISO completo (legacy catalog / API): usar tal cual
    if (raw.includes('T') || raw.endsWith('Z')) {
      const iso = new Date(raw);
      if (!Number.isNaN(iso.getTime())) return iso.getTime();
    }

    let hora = (adiso.horaPublicacion || '00:00').trim();
    if (hora.length === 4) hora = `${hora.substring(0, 2)}:${hora.substring(2)}`;
    else if (hora.length >= 8) hora = hora.slice(0, 5); // HH:MM:SS → HH:MM
    else if (hora.length !== 5) hora = '00:00';

    const date = new Date(`${raw}T${hora}:00`);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  } catch {
    return 0;
  }
}

/**
 * Adelanto temporal por calidad visual — SOLO desempate dentro del mismo día.
 * Un aviso de hoy sin foto siempre gana a uno de ayer con foto.
 */
const IMAGE_BOOST_MS = 2 * 60 * 60 * 1000; // 2 h (desempate suave)
const CATALOG_EXTRA_BOOST_MS = 30 * 60 * 1000; // 30 min
const MULTI_IMAGE_BOOST_MS = 20 * 60 * 1000; // 20 min

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

/** Día civil YYYY-MM-DD (sin hora) para ranking por recencia oficial. */
function getPublishedDayKey(adiso: Adiso): string {
  const raw = String(adiso.fechaPublicacion || '').trim();
  if (!raw) return '0000-00-00';
  if (raw.includes('T')) return raw.slice(0, 10);
  return raw.slice(0, 10);
}

/**
 * Comparador del feed por defecto ("recientes"):
 * 1. Promoción pagada (premium/destacada)
 * 2. Día de publicación — lo más nuevo SIEMPRE gana (aunque el otro tenga foto)
 * 3. Dentro del mismo día: timestamp efectivo (foto/catálogo/personalización)
 * 4. Tamaño de paquete legacy
 * 5. id estable
 */
export function compareRecientesFeed(
  a: Adiso,
  b: Adiso,
  interestProfile?: UserInterestProfile | null,
): number {
  const ra = a.promotionRank ?? 0;
  const rb = b.promotionRank ?? 0;
  if (ra !== rb) return rb - ra;

  const dayA = getPublishedDayKey(a);
  const dayB = getPublishedDayKey(b);
  if (dayA !== dayB) {
    return dayB.localeCompare(dayA); // más reciente primero
  }

  const fa = getFeedEffectiveTimestamp(a, interestProfile);
  const fb = getFeedEffectiveTimestamp(b, interestProfile);
  const dateCmp = fb - fa;
  if (dateCmp !== 0) return dateCmp;

  const pa = getPackageRank(a.tamaño);
  const pb = getPackageRank(b.tamaño);
  if (pa !== pb) return pb - pa;

  return a.id.localeCompare(b.id);
}

/**
 * Exploration / diversity: every `everyN` items, swap in a lower-ranked ad
 * from a different category than the previous slot (epsilon-style explore).
 * Keeps personalization strong while avoiding filter bubbles.
 */
export function injectFeedExploration(
  sorted: Adiso[],
  options?: { everyN?: number; exploreFromTail?: number },
): Adiso[] {
  if (sorted.length < 6) return sorted;
  const everyN = options?.everyN ?? 5;
  const exploreFromTail = options?.exploreFromTail ?? Math.min(20, sorted.length);
  const result = [...sorted];
  const pool = sorted.slice(-exploreFromTail);

  for (let i = everyN - 1; i < result.length; i += everyN) {
    const prevCat = result[i - 1]?.categoria;
    const candidate = pool.find(
      (a) => a.categoria !== prevCat && !result.slice(Math.max(0, i - 2), i).some((x) => x.id === a.id)
    );
    if (!candidate) continue;
    const fromIdx = result.findIndex((a) => a.id === candidate.id);
    if (fromIdx <= i) continue;
    const [item] = result.splice(fromIdx, 1);
    result.splice(i, 0, item);
  }
  return result;
}
