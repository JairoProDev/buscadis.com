export type {
  Arquetipo,
  Plan,
  NivelVerificacion,
  TipoModulo,
  ConfigModulo,
  Negocio,
  TemaModo,
  TemaMarcaVars,
} from './types';

export {
  NegocioSchema,
  ConfigModuloSchema,
  TipoModuloSchema,
  parseNegocio,
  safeParseNegocio,
  parseConfigModulo,
} from './schemas';

export { derivarTema, temaToStyle, contrasteAccion } from './tema/derivar-tema';

export { MODULO_META, planSuficiente } from './modulos/contrato';
export type { ModuloMeta } from './modulos/contrato';
export { ordenArquetipo, ORDEN_RETAIL } from './modulos/orden-arquetipo';
export { resolverModulos } from './modulos/resolver';
export type { ModuloResuelto } from './modulos/resolver';
export { RenderizadorModulos } from './modulos/RenderizadorModulos';
export { PerfilVivoRoot } from './modulos/PerfilVivoRoot';

export { DEMO_RETAIL_NEGOCIO } from './fixtures/demo-retail';
export { negocioFromBusinessProfile } from './bridge/from-business-profile';
