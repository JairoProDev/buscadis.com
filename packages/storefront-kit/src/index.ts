export type {
  TenantMode,
  TenantRadius,
  TenantDensity,
  TenantAccent,
  TenantFont,
  TenantPresetId,
  LegacyTenantPresetId,
  TenantPresetInput,
  TenantContract,
  TenantPreset,
  DerivedTenantTheme,
  StorefrontSurfaceVars,
} from './types';

export { TENANT_PRESETS, getTenantPreset, normalizeTenantPresetId } from './presets';
export { derivarTemaTenant, contrastRatio } from './derivar-tema-tenant';
export {
  buildStorefrontTheme,
  type BuildStorefrontThemeInput,
  type StorefrontThemeResult,
} from './build-theme-style';
