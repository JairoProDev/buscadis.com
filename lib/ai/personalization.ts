// Personalización ligera del asistente de IA y de las recomendaciones,
// basada en el user_interest_profile (afinidad por categoría y por
// keywords derivada de favoritos/descartes).

import { Adiso, Categoria } from '@/types';
import type { UserInterestProfile } from '@/lib/interactions';

/**
 * Calcula un puntaje de afinidad de un adiso con el perfil del usuario:
 * suma la afinidad por categoría y la afinidad por cada keyword del
 * perfil que aparezca en el título/descripción del adiso.
 */
export function personalizationBoost(adiso: Adiso, profile: UserInterestProfile): number {
  let boost = 0;

  const categoriaSignal = profile.categoriaSignals[adiso.categoria];
  if (categoriaSignal) boost += categoriaSignal * 2;

  const texto = `${adiso.titulo} ${adiso.descripcion}`.toLowerCase();
  for (const [keyword, signal] of Object.entries(profile.keywordSignals)) {
    if (signal > 0 && texto.includes(keyword)) {
      boost += signal;
    }
  }

  return boost;
}

/**
 * Reordena una lista de adisos dando un pequeño impulso a los que
 * coinciden con los intereses del usuario, preservando el orden de
 * relevancia original como criterio principal.
 */
export function personalizeAdisos(adisos: Adiso[], profile: UserInterestProfile | null): Adiso[] {
  if (!profile) return adisos;

  return adisos
    .map((adiso, index) => ({
      adiso,
      score: (adisos.length - index) + personalizationBoost(adiso, profile),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ adiso }) => adiso);
}

/** Categorías con señal positiva en el perfil, ordenadas de mayor a menor afinidad. */
export function topInterestCategories(profile: UserInterestProfile, max = 2): Categoria[] {
  return Object.entries(profile.categoriaSignals)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([categoria]) => categoria as Categoria);
}

const HORAS_POR_PUNTO_AFINIDAD = 4 * 60 * 60 * 1000; // 4h de "antigüedad" perdonada por punto de afinidad
const MAX_BOOST_MS = 3 * 24 * 60 * 60 * 1000; // tope de 3 días, para no romper el orden cronológico

/**
 * Convierte la afinidad de un adiso con el perfil del usuario en un
 * adelanto temporal (ms) que se suma a su fecha de publicación al
 * ordenar el feed por "recientes". Así, anuncios afines a los intereses
 * del usuario aparecen un poco antes sin desordenar por completo el feed.
 */
export function personalizationFreshnessBoostMs(adiso: Adiso, profile: UserInterestProfile | null | undefined): number {
  if (!profile) return 0;
  const boost = personalizationBoost(adiso, profile);
  if (boost <= 0) return 0;
  return Math.min(boost * HORAS_POR_PUNTO_AFINIDAD, MAX_BOOST_MS);
}
