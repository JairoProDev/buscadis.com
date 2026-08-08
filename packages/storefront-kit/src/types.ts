export type TenantMode = 'light' | 'dark';
export type TenantRadius = 'sharp' | 'rounded' | 'pill';
export type TenantDensity = 'compact' | 'comfortable';
export type TenantAccent = 'solid' | 'outline' | 'gradient';
export type TenantFont = 'sans' | 'serif' | 'display';

/** Canonical preset ids (product language). */
export type TenantPresetId =
  | 'buscadis'
  | 'executive'
  | 'minimal'
  | 'organic'
  | 'nocturno';

/** Legacy DB / API value — maps to nocturno. */
export type LegacyTenantPresetId = 'cyberpunk';

export type TenantPresetInput = TenantPresetId | LegacyTenantPresetId;

/** Closed tenant contract — only these five axes are user-controlled. */
export interface TenantContract {
  seed: string;
  mode: TenantMode;
  radius: TenantRadius;
  density: TenantDensity;
  accent: TenantAccent;
}

export interface TenantPreset extends TenantContract {
  id: TenantPresetId;
  label: string;
  /** Presentation-only; not part of the 5-var CSS contract. */
  fontFamily: TenantFont;
}

export interface DerivedTenantTheme {
  '--bs-tenant-seed': string;
  '--bs-tenant-mode': TenantMode;
  '--bs-tenant-radius': TenantRadius;
  '--bs-tenant-density': TenantDensity;
  '--bs-tenant-accent': TenantAccent;
  '--bs-action': string;
  '--bs-action-hover': string;
  '--bs-fg-on-action': string;
  '--bs-action-subtle': string;
  '--bs-identity': string;
}

export interface StorefrontSurfaceVars {
  '--bp-canvas': string;
  '--bp-surface': string;
  '--bp-surface-elevated': string;
  '--bp-text': string;
  '--bp-text-muted': string;
  '--bp-border': string;
  '--bp-radius': string;
  '--bp-density-gap': string;
  '--theme-radius': string;
  '--brand-color': string;
  '--brand-accent': string;
}
