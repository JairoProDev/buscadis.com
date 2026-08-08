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
  mensajeWhatsAppPromo,
  waMeUrl,
} from './handoff/token';
export { buildHandoffLinks } from './handoff/build-links';
export {
  DEMO_RETAIL_NEGOCIO,
  DEMO_RETAIL_PRODUCTOS,
  buildDemoRetailPayload,
} from './fixtures/demo-retail';
export {
  DEMO_CITA_NEGOCIO,
  DEMO_CITA_SERVICIOS,
  buildDemoCitaPayload,
} from './fixtures/demo-cita';
export {
  DEMO_COMIDA_NEGOCIO,
  DEMO_COMIDA_PRODUCTOS,
  buildDemoComidaPayload,
} from './fixtures/demo-comida';
export {
  DEMO_PROFESIONAL_NEGOCIO,
  buildDemoProfesionalPayload,
} from './fixtures/demo-profesional';
export {
  DEMO_LOCAL_NEGOCIO,
  buildDemoLocalPayload,
} from './fixtures/demo-local';
export {
  DEMO_ALTO_TICKET_NEGOCIO,
  buildDemoAltoTicketPayload,
} from './fixtures/demo-alto-ticket';
export {
  DEMO_PERFIL_VIVO_SLUGS,
  DEMO_META,
  isDemoPerfilVivoSlug,
  buildDemoPerfilVivoPayload,
} from './demos';
export type { DemoPerfilVivoSlug } from './demos';
export { sanitizePerfilPayload } from './sanitize';
export { promocionSiVigente, esPromocionVigente } from './promo/vigente';
export { calcularEstadoVivo, formatPrecio } from './estado/calcular-estado';
export { negocioFromBusinessProfile } from './bridge/from-business-profile';
export {
  buildPerfilPayloadFromSources,
  horarioFromBusinessHours,
  productoFromCatalogRow,
  enrichNegocioFromProfile,
} from './bridge/build-payload';
export {
  faqsFromProfileBlocks,
  faqsDerivadasDelPerfil,
  nosotrosFromProfile,
  promocionFromProfile,
  galeriaFromProfile,
  novedadesFromProfile,
  equipoFromProfileBlocks,
} from './bridge/support-content';
export type {
  PerfilPayload,
  Negocio,
  Producto,
  HandoffPayload,
} from './types';
