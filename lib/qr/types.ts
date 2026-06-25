export type QrStyleTier = 'free' | 'pro';

export type QrRenderMode = 'classic' | 'branded' | 'visual';

export type QrQaStatus = 'pending' | 'passed' | 'degraded' | 'failed';

export type QrDotType = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';

export type QrCornerSquareType = 'square' | 'dot' | 'extra-rounded';

export type QrCornerDotType = 'square' | 'dot';

export interface QrGradientStop {
  offset: number;
  color: string;
}

export interface QrStyleConfig {
  renderMode?: QrRenderMode;
  dotsColor?: string;
  backgroundColor?: string;
  dotType?: QrDotType;
  cornerSquareType?: QrCornerSquareType;
  cornerDotType?: QrCornerDotType;
  gradient?: {
    type: 'linear' | 'radial';
    rotation?: number;
    colorStops: QrGradientStop[];
  };
  logoUrl?: string;
  hideBackgroundDots?: boolean;
  imageSize?: number;
  halftoneIntensity?: number;
  dotScale?: number;
  finderBrandColor?: string;
  buscadisFinderMark?: boolean;
  quietZoneModules?: number;
  frameText?: string;
  frameColor?: string;
  presetId?: string;
  /** Fondo PNG/SVG transparente (solo el código, sin placa blanca). */
  transparentBackground?: boolean;
}

export interface QrCodeRecord {
  id: string;
  business_profile_id: string;
  short_code: string;
  destination_type: string;
  destination_slug: string | null;
  is_active: boolean;
  style_tier: QrStyleTier;
  style_config: QrStyleConfig;
  render_mode?: QrRenderMode;
  qa_status?: QrQaStatus | null;
  qa_fallback_mode?: QrRenderMode | null;
  generation_error?: string | null;
  scan_count: number;
  asset_hash?: string | null;
  cached_png_path?: string | null;
  created_at: string;
  updated_at: string;
}

export type QrKitTemplate =
  | 'flyer-basic'
  | 'story'
  | 'table-tent'
  | 'sticker'
  | 'poster'
  | 'business-card'
  | 'packaging';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface GenerateQrResult {
  png: Buffer;
  requestedMode: QrRenderMode;
  actualMode: QrRenderMode;
  qaStatus: QrQaStatus;
  degraded: boolean;
}
