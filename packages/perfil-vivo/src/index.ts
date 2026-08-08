export type {
  Arquetipo,
  Plan,
  NivelVerificacion,
  TipoModulo,
  ConfigModulo,
  Negocio,
  TemaModo,
  TemaMarcaVars,
  Producto,
  Horario,
  EstadoVivo,
  MetricasVerificadas,
  MetodoPago,
  PerfilPayload,
  HandoffPayload,
  CanalHandoff,
  Resena,
  ItemFaq,
  PromocionVigente,
  FotoGaleria,
  NosotrosContenido,
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
export type { HandoffLinks } from './modulos/PerfilContext';

export { calcularEstadoVivo, formatPrecio } from './estado/calcular-estado';
