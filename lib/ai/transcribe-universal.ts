/**
 * Audio → text for profile ingest. Prefers Gemini; falls back to OpenAI Whisper.
 */
import { transcribeAudio, isGeminiConfigured } from '@/lib/ai/gemini';
import { openaiClient } from '@/lib/ai/openai-client';

async function toWhisperFile(source: File | Blob | string): Promise<File> {
  if (typeof source === 'string') {
    const res = await fetch(source);
    const blob = await res.blob();
    const type = blob.type || 'audio/webm';
    return new File([blob], 'audio.webm', { type });
  }
  if (source instanceof File) return source;
  const type = source.type || 'audio/webm';
  return new File([source], 'audio.webm', { type });
}

export async function transcribeAudioUniversal(source: File | Blob | string): Promise<string> {
  if (isGeminiConfigured()) {
    try {
      const text = await transcribeAudio(source);
      if (text?.trim()) return text.trim();
    } catch (e) {
      console.warn('[transcribe] Gemini failed:', (e as Error).message);
    }
  }

  if (!openaiClient) return '';

  const file = await toWhisperFile(source);
  const result = await openaiClient.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'es',
  });
  return (result.text || '').trim();
}
