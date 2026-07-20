/**
 * Vector engine — ingestion.
 *
 * Normalizes any raw input (text, audio, image, pdf, doc, link) into text-first
 * `Artifact`s that the structuring step can reason over. Media understanding is
 * delegated to Gemini; links are fetched and stripped to readable text.
 */
import {
  transcribeAudio,
  extractTextFromDocument,
  describeImage,
  detectProductsInImage,
  isGeminiConfigured,
} from '@/lib/ai/gemini';
import type { Artifact, IngestSource } from './types';

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Reconstruct a data URL or public URL usable by Gemini fetch helpers. */
function mediaSourceFor(source: IngestSource): File | Blob | string | null {
  if (source.dataBase64 && source.mimeType) {
    return `data:${source.mimeType};base64,${source.dataBase64}`;
  }
  if (source.storedUrl) return source.storedUrl;
  if (source.url) return source.url;
  return null;
}

/** Best-effort HTML -> text extraction for links (no heavy deps). */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
}

async function ingestLink(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BuscadisVectorBot/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return `No se pudo leer el enlace (${res.status}): ${url}`;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html') || ct.includes('text/plain')) {
      const body = await res.text();
      const text = htmlToText(body);
      return `Contenido del enlace ${url}:\n${text}`;
    }
    return `Enlace ${url} (tipo ${ct}) no es texto legible.`;
  } catch (e) {
    return `No se pudo acceder al enlace ${url}: ${(e as Error).message}`;
  }
}

async function ingestOne(source: IngestSource, index: number): Promise<Artifact> {
  const label = source.filename || source.url || `${source.kind}-${index + 1}`;
  const geminiReady = isGeminiConfigured();

  try {
    switch (source.kind) {
      case 'text':
        return {
          id: makeId('txt'),
          kind: 'text',
          label: 'Texto del usuario',
          rawText: source.text?.trim() || '',
        };

      case 'link': {
        const url = source.url || source.text || '';
        return {
          id: makeId('lnk'),
          kind: 'link',
          label: url,
          rawText: url ? await ingestLink(url) : '',
        };
      }

      case 'audio': {
        const media = mediaSourceFor(source);
        const rawText = media && geminiReady ? await transcribeAudio(media) : '';
        return { id: makeId('aud'), kind: 'audio', label, rawText, mimeType: source.mimeType };
      }

      case 'pdf':
      case 'doc': {
        const media = mediaSourceFor(source);
        const rawText = media && geminiReady ? await extractTextFromDocument(media) : '';
        return { id: makeId('doc'), kind: source.kind, label, rawText, mimeType: source.mimeType };
      }

      case 'image': {
        const media = mediaSourceFor(source);
        let rawText = '';
        let extractedJson: unknown;
        if (media && geminiReady) {
          rawText = await describeImage(media);
          // Best-effort product detection; never fail the whole ingest on this.
          try {
            extractedJson = await detectProductsInImage(media);
          } catch {
            /* noop */
          }
        }
        return {
          id: makeId('img'),
          kind: 'image',
          label,
          rawText,
          extractedJson,
          mediaUrl: source.storedUrl || source.url,
          mimeType: source.mimeType,
        };
      }

      default:
        return { id: makeId('unk'), kind: 'text', label, rawText: source.text || '' };
    }
  } catch (e) {
    return {
      id: makeId('err'),
      kind: source.kind,
      label,
      rawText: `No se pudo procesar ${label}: ${(e as Error).message}`,
    };
  }
}

/**
 * Ingest every source concurrently (bounded) into text-first artifacts.
 */
export async function ingestSources(sources: IngestSource[]): Promise<Artifact[]> {
  const artifacts: Artifact[] = [];
  const CONCURRENCY = 4;
  for (let i = 0; i < sources.length; i += CONCURRENCY) {
    const batch = sources.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((s, j) => ingestOne(s, i + j)));
    artifacts.push(...results);
  }
  return artifacts;
}
