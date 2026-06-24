import type { QrRenderMode, QrStyleConfig } from './types';

export function applyPreviewStyleOverrides(
  base: QrStyleConfig,
  params: URLSearchParams
): QrStyleConfig {
  if (params.get('preview') !== '1') return base;

  const next: QrStyleConfig = { ...base };
  const mode = params.get('mode');
  if (mode && ['classic', 'branded', 'visual'].includes(mode)) {
    next.renderMode = mode as QrRenderMode;
  }
  const dots = params.get('dots');
  if (dots && /^#[0-9a-fA-F]{6}$/.test(dots)) next.dotsColor = dots;
  const bg = params.get('bg');
  if (bg && /^#[0-9a-fA-F]{6}$/.test(bg)) next.backgroundColor = bg;
  const dotType = params.get('dotType');
  if (dotType) next.dotType = dotType as QrStyleConfig['dotType'];
  const hi = params.get('hi');
  if (hi) {
    const n = Number(hi);
    if (Number.isFinite(n)) next.halftoneIntensity = n;
  }
  const ds = params.get('ds');
  if (ds) {
    const n = Number(ds);
    if (Number.isFinite(n)) next.dotScale = n;
  }
  const cs = params.get('cornerSquare');
  if (cs) next.cornerSquareType = cs as QrStyleConfig['cornerSquareType'];
  const cd = params.get('cornerDot');
  if (cd) next.cornerDotType = cd as QrStyleConfig['cornerDotType'];
  return next;
}

export function buildPreviewQuery(styleConfig: QrStyleConfig): string {
  const p = new URLSearchParams({
    format: 'png',
    preview: '1',
    refresh: '1',
    mode: styleConfig.renderMode || 'branded',
    dots: styleConfig.dotsColor || '#1e293b',
    bg: styleConfig.backgroundColor || '#ffffff',
  });
  if (styleConfig.dotType) p.set('dotType', styleConfig.dotType);
  if (styleConfig.halftoneIntensity != null) p.set('hi', String(styleConfig.halftoneIntensity));
  if (styleConfig.dotScale != null) p.set('ds', String(styleConfig.dotScale));
  if (styleConfig.cornerSquareType) p.set('cornerSquare', styleConfig.cornerSquareType);
  if (styleConfig.cornerDotType) p.set('cornerDot', styleConfig.cornerDotType);
  return p.toString();
}

export function previewStyleFingerprint(styleConfig: QrStyleConfig): string {
  return [
    styleConfig.renderMode,
    styleConfig.dotsColor,
    styleConfig.backgroundColor,
    styleConfig.dotType,
    styleConfig.halftoneIntensity,
    styleConfig.dotScale,
    styleConfig.presetId,
    styleConfig.cornerSquareType,
    styleConfig.cornerDotType,
  ].join('|');
}
