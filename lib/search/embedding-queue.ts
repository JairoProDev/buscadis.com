import { generateAndStoreEmbedding } from '@/lib/ai/embeddings';

/**
 * Fire-and-forget embedding generation after adiso create/update.
 * Never blocks the publish response.
 */
export function queueAdisoEmbedding(adisoId: string): void {
  if (!adisoId) return;
  void generateAndStoreEmbedding(adisoId).catch((err) => {
    console.error(`[embedding-queue] Failed for ${adisoId}:`, err);
  });
}
