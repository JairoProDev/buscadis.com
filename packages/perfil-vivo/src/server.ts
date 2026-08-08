/** Entrypoint servidor — handoff con node:crypto. No importar desde client. */
export {
  crearTokenHandoff,
  verificarTokenHandoff,
  crearHandoffWhatsApp,
  crearHandoffLlamada,
  crearHandoffRuta,
  buildHandoffPath,
  mensajeWhatsAppPerfil,
  mensajeWhatsAppProducto,
  waMeUrl,
} from './handoff/token';
export { buildHandoffLinks } from './handoff/build-links';
export {
  DEMO_RETAIL_NEGOCIO,
  DEMO_RETAIL_PRODUCTOS,
  buildDemoRetailPayload,
} from './fixtures/demo-retail';
export { calcularEstadoVivo, formatPrecio } from './estado/calcular-estado';
export { negocioFromBusinessProfile } from './bridge/from-business-profile';
export {
  buildPerfilPayloadFromSources,
  horarioFromBusinessHours,
  productoFromCatalogRow,
  enrichNegocioFromProfile,
} from './bridge/build-payload';
export type {
  PerfilPayload,
  Negocio,
  Producto,
  HandoffPayload,
} from './types';
