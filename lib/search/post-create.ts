import { Adiso } from '@/types';
import { queueAdisoEmbedding } from './embedding-queue';
import { syncAdisoToTypesense } from './suggest';

export function onAdisoSearchIndexUpdate(adiso: Pick<Adiso, 'id' | 'titulo' | 'categoria'>): void {
  queueAdisoEmbedding(adiso.id);
  void syncAdisoToTypesense(adiso);
}
