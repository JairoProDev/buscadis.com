/**
 * Vector engine — reusable "machine" that turns chaotic multimodal input into
 * structured, applied data. Today it targets the Buscadis business profile;
 * new targets (Publicadis, Vectorify) can reuse ingest + structure + a new
 * TargetAdapter.
 *
 *   raw input --ingest--> artifacts --structure--> draft --apply--> target
 */
export { ingestSources } from './ingest';
export { structureArtifacts } from './structure';
export { applyDraft } from './apply';
export { persistArtifacts, uploadSourceMedia, listSourceDocuments } from './sources-store';
export { buscadisTarget } from './targets/buscadis-profile';
export * from './schema';
export type {
  Artifact,
  IngestSource,
  IngestKind,
  StructureInput,
  ApplyInput,
  ApplyResult,
  TargetAdapter,
} from './types';
