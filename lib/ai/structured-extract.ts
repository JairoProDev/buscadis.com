/**
 * Structured JSON extraction for profile builder — Gemini first, OpenAI fallback.
 */
import { generateObject } from 'ai';
import type { ZodType, ZodTypeDef } from 'zod';
import {
  structuredExtract as geminiStructuredExtract,
  isGeminiConfigured,
  type GeminiPart,
} from '@/lib/ai/gemini';
import { hasOpenAIKey, openai, AI_MODELS } from '@/lib/ai/openai-client';

export function isProfileAIConfigured(): boolean {
  return isGeminiConfigured() || hasOpenAIKey();
}

export async function structuredExtractWithFallback<T>(
  parts: GeminiPart[],
  schema: ZodType<T, ZodTypeDef, unknown>,
  opts?: { systemPrompt?: string; model?: string; temperature?: number }
): Promise<T> {
  if (isGeminiConfigured()) {
    try {
      return await geminiStructuredExtract(parts, schema, opts);
    } catch (e) {
      console.warn('[structured-extract] Gemini failed:', (e as Error).message);
      if (!hasOpenAIKey()) throw e;
    }
  }

  if (!hasOpenAIKey()) {
    throw new Error('No hay proveedor de IA configurado (GEMINI_API_KEY u OPENAI_API_KEY).');
  }

  const prompt = parts
    .map((p) => (typeof p === 'string' ? p : JSON.stringify(p)))
    .join('\n\n');

  const { object } = await generateObject({
    model: openai(AI_MODELS.ROUTER),
    schema,
    system: opts?.systemPrompt,
    prompt,
    temperature: opts?.temperature ?? 0.2,
  });

  return object;
}
