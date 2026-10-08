/**
 * Política de extracción Rueda: sin OpenAI por defecto (solo heurísticas + OCR local opcional).
 *
 * Activar API solo si explícitamente: RUEDA_USE_OPENAI=1
 */
export function ruedaUseOpenAiApi(): boolean {
  return process.env.RUEDA_USE_OPENAI === '1' || process.env.RUEDA_USE_OPENAI === 'true';
}

export function ruedaExtractionMode(): 'local' | 'openai' {
  return ruedaUseOpenAiApi() ? 'openai' : 'local';
}
