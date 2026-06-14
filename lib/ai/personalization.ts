// Personalización ligera del asistente de IA y de las recomendaciones,
// basada en el user_interest_profile (afinidad por categoría y por
// keywords derivada de favoritos/descartes).

import { Adiso, Categoria } from '@/types';
import { UserInterestProfile } from '@/lib/interactions';

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
