/**
 * Módulo comercial — portable hacia Vectorify.
 * @see docs/comercial/ARQUITECTURA.md
 */
export * from './types';
export * from './pipeline';
export { backfillOpportunitiesFromBatch, createOpportunityFromAdisoLead } from './rueda-sync';
export {
  PAID_CLIENT_BATCH_DOCS,
  backfillPaidClientBatches,
  syncPaidClientAdisoToCrm,
} from './paid-client-sync';
