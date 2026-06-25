import type { QrRenderMode, QrStyleConfig } from './types';

function readStyleParams(params: URLSearchParams, next: QrStyleConfig): void {
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
  const img = params.get('img');
  if (img) {
    const n = Number(img);
    if (Number.isFinite(n)) next.imageSize = n;
  }
  const tbg = params.get('tbg');
  if (tbg === '1') next.transparentBackground = true;
}

/** Aplica overrides de query cuando hay parámetros de estilo (preview o descarga). */
export function applyStyleQueryOverrides(
  base: QrStyleConfig,
  params: URLSearchParams
): QrStyleConfig {
  const hasStyle =
    params.get('preview') === '1' ||
    params.has('mode') ||
    params.has('dots') ||
    params.has('bg') ||
    params.has('dotType') ||
    params.has('hi') ||
    params.has('ds') ||
    params.has('cornerSquare') ||
    params.has('cornerDot') ||
    params.has('img') ||
    params.has('tbg');

  if (!hasStyle) return base;

  const next: QrStyleConfig = { ...base };
  readStyleParams(params, next);
  return next;
}

/** @deprecated use applyStyleQueryOverrides */
export function applyPreviewStyleOverrides(
  base: QrStyleConfig,
  params: URLSearchParams
): QrStyleConfig {
  return applyStyleQueryOverrides(base, params);
}

function appendStyleParams(p: URLSearchParams, styleConfig: QrStyleConfig): void {
  p.set('mode', styleConfig.renderMode || 'branded');
  p.set('dots', styleConfig.dotsColor || '#1e293b');
  p.set('bg', styleConfig.backgroundColor || '#ffffff');
  if (styleConfig.dotType) p.set('dotType', styleConfig.dotType);
  if (styleConfig.halftoneIntensity != null) p.set('hi', String(styleConfig.halftoneIntensity));
  if (styleConfig.dotScale != null) p.set('ds', String(styleConfig.dotScale));
  if (styleConfig.cornerSquareType) p.set('cornerSquare', styleConfig.cornerSquareType);
  if (styleConfig.cornerDotType) p.set('cornerDot', styleConfig.cornerDotType);
  if (styleConfig.imageSize != null) p.set('img', String(styleConfig.imageSize));
  if (styleConfig.transparentBackground) p.set('tbg', '1');
}

export function buildPreviewQuery(styleConfig: QrStyleConfig): string {
  const p = new URLSearchParams({
    format: 'png',
    preview: '1',
    refresh: '1',
  });
  appendStyleParams(p, styleConfig);
  return p.toString();
}

/** Query para descargas — mismos estilos que la vista previa, sin caché obsoleta. */
export function buildDownloadQuery(styleConfig: QrStyleConfig, extra?: Record<string, string>): string {
  const p = new URLSearchParams({ refresh: '1' });
  appendStyleParams(p, styleConfig);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
  }
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
    styleConfig.imageSize,
    styleConfig.transparentBackground ? '1' : '0',
  ].join('|');
}
